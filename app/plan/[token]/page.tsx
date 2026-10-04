import { PlanAccessForm } from "@/components/plan/plan-access-form";
import { PlanUnavailable } from "@/components/plan/plan-unavailable";
import { PlanWelcome } from "@/components/plan/plan-welcome";
import { getPlanByToken, evaluatePlanAccess } from "@/lib/plan/plans";
import { getPlanSession } from "@/lib/plan/plan-access";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const plan = await getPlanByToken(token);

  // Never reveal whether a token exists.
  if (!plan) {
    return <PlanAccessForm token={token} />;
  }

  const access = evaluatePlanAccess(plan);
  if (!access.ok) return <PlanUnavailable />;

  const session = await getPlanSession(plan.id);
  if (!session) return <PlanAccessForm token={token} />;

  return (
    <PlanWelcome
      name={session.name}
      title={plan.title}
      subtitle={plan.subtitle}
    />
  );
}
