import { redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { AuthForm } from '@/components/AuthForm';
import { getUser } from '@/lib/auth';

export default async function SignupPage() {
  if (await getUser()) redirect('/dashboard');
  return (
    <Shell title="CREATE ACCOUNT" subtitle="START YOUR COVERAGE ASSESSMENT" maxWidth="560px">
      <AuthForm mode="signup" />
    </Shell>
  );
}
