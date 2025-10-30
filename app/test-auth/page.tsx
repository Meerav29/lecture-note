'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../lib/supabase/client';

export default function TestAuthPage() {
  const { user, session } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const supabase = createClient();

  const runTests = async () => {
    const results: any[] = [];

    // Test 1: Check if user is authenticated in AuthContext
    results.push({
      test: 'AuthContext User',
      status: user ? '✅ Pass' : '❌ Fail',
      details: user ? `User ID: ${user.id}` : 'No user found'
    });

    // Test 2: Check if session exists
    results.push({
      test: 'AuthContext Session',
      status: session ? '✅ Pass' : '❌ Fail',
      details: session ? `Session exists, expires: ${new Date(session.expires_at! * 1000).toLocaleString()}` : 'No session'
    });

    // Test 3: Check Supabase client auth
    const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
    results.push({
      test: 'Supabase Client Auth',
      status: supabaseUser ? '✅ Pass' : '❌ Fail',
      details: supabaseUser ? `User ID: ${supabaseUser.id}` : `Error: ${userError?.message || 'No user'}`
    });

    // Test 4: Check Supabase session
    const { data: { session: supabaseSession }, error: sessionError } = await supabase.auth.getSession();
    results.push({
      test: 'Supabase Client Session',
      status: supabaseSession ? '✅ Pass' : '❌ Fail',
      details: supabaseSession ? `Access token exists: ${supabaseSession.access_token.substring(0, 20)}...` : `Error: ${sessionError?.message || 'No session'}`
    });

    // Test 5: Try to query lectures table (SELECT)
    const { data: lectures, error: selectError } = await supabase
      .from('lectures')
      .select('*')
      .limit(1);

    results.push({
      test: 'RLS Policy - SELECT',
      status: !selectError ? '✅ Pass' : '❌ Fail',
      details: selectError ? `Error: ${selectError.message}` : `Can read ${lectures?.length || 0} lectures`
    });

    // Test 6: Try to insert a test lecture
    if (user) {
      const { data: insertData, error: insertError } = await supabase
        .from('lectures')
        .insert({
          user_id: user.id,
          title: 'TEST - DELETE ME',
          transcript: 'Test transcript',
          metadata: {}
        })
        .select()
        .single();

      results.push({
        test: 'RLS Policy - INSERT',
        status: !insertError ? '✅ Pass' : '❌ Fail',
        details: insertError ? `Error: ${insertError.message}` : `Successfully inserted lecture ID: ${insertData?.id}`
      });

      // Clean up test lecture if successful
      if (insertData) {
        await supabase.from('lectures').delete().eq('id', insertData.id);
      }
    } else {
      results.push({
        test: 'RLS Policy - INSERT',
        status: '⏭️ Skipped',
        details: 'No user authenticated'
      });
    }

    // Test 7: Check storage bucket (try listing files instead of buckets)
    let bucketExists = false;
    let bucketDetails = '';

    try {
      const { data: files, error: listError } = await supabase.storage
        .from('lecture-audio')
        .list('', { limit: 1 });

      if (!listError) {
        bucketExists = true;
        bucketDetails = `Bucket 'lecture-audio' exists and is accessible`;
      } else {
        bucketDetails = `Error: ${listError.message}`;
      }
    } catch (err: any) {
      bucketDetails = `Error: ${err.message || 'Bucket not accessible'}`;
    }

    results.push({
      test: 'Storage Bucket Exists',
      status: bucketExists ? '✅ Pass' : '❌ Fail',
      details: bucketDetails
    });

    // Test 8: Try to upload to storage
    if (user) {
      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lecture-audio')
        .upload(`${user.id}/test-${Date.now()}.txt`, testFile);

      results.push({
        test: 'Storage Upload Permission',
        status: !uploadError ? '✅ Pass' : '❌ Fail',
        details: uploadError ? `Error: ${uploadError.message}` : `Successfully uploaded: ${uploadData?.path}`
      });

      // Clean up test file if successful
      if (uploadData) {
        await supabase.storage.from('lecture-audio').remove([uploadData.path]);
      }
    } else {
      results.push({
        test: 'Storage Upload Permission',
        status: '⏭️ Skipped',
        details: 'No user authenticated'
      });
    }

    setTestResults(results);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Authentication & RLS Test Page</h1>

      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          This page will help diagnose the RLS policy error by testing all authentication and database permissions.
        </p>

        {!user ? (
          <div style={{
            padding: '1rem',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            ⚠️ You are not signed in. Please sign in first to run all tests.
          </div>
        ) : (
          <div style={{
            padding: '1rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            ✅ Signed in as: {user.email}
          </div>
        )}

        <button
          onClick={runTests}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--accent-gradient)',
            color: 'var(--accent-text-contrast)',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Run Diagnostic Tests
        </button>
      </div>

      {testResults.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Test Results</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {testResults.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  background: 'var(--surface-panel)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{result.test}</strong>
                  <span style={{
                    fontWeight: 600,
                    color: result.status.includes('✅') ? '#10b981' : result.status.includes('❌') ? '#ef4444' : '#6b7280'
                  }}>
                    {result.status}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {result.details}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'var(--surface-info)',
            border: '1px solid var(--surface-info-border)',
            borderRadius: '8px'
          }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Diagnosis</h3>
            <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>
              {testResults.find(r => r.test === 'RLS Policy - INSERT' && r.status.includes('❌')) && (
                <li>❌ <strong>INSERT permission failed</strong> - RLS policy is blocking inserts. Check Supabase policies.</li>
              )}
              {testResults.find(r => r.test === 'Supabase Client Auth' && r.status.includes('❌')) && (
                <li>❌ <strong>Auth not working</strong> - The Supabase client cannot see your session. Try signing out and back in.</li>
              )}
              {testResults.find(r => r.test === 'Storage Bucket Exists' && r.status.includes('❌')) && (
                <li>❌ <strong>Storage bucket missing</strong> - Create the lecture-audio bucket in Supabase Storage.</li>
              )}
              {testResults.find(r => r.test === 'Storage Upload Permission' && r.status.includes('❌')) && (
                <li>❌ <strong>Storage upload failed</strong> - Storage policies need to be configured.</li>
              )}
              {testResults.every(r => r.status.includes('✅') || r.status.includes('⏭️')) && (
                <li>✅ <strong>All tests passed!</strong> Your setup is working correctly.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
