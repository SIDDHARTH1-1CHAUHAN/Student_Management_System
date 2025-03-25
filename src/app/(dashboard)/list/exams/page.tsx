import { auth } from "@clerk/nextjs/server";
import ExamDashboard from "@/components/ExamDashboard";

export default async function ExamsPage() {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  return <ExamDashboard role={role} />;
}