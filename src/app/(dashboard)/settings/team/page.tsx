import type { Metadata } from "next";
import { requireBusiness } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usageFor } from "@/services/limits-service";
import { listTeam } from "@/services/team-service";
import { TeamManager } from "./team-manager";

export const metadata: Metadata = { title: "Staff accounts" };

export default async function TeamPage() {
  const { businessId, user, role } = await requireBusiness();
  const [members, usage] = await Promise.all([listTeam(businessId, user.id), usageFor(businessId)]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff accounts</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <TeamManager
          members={members}
          canManage={role === "owner" || role === "admin"}
          isOwner={role === "owner"}
          used={usage.team.used}
          limit={usage.team.limit}
        />
      </CardContent>
    </Card>
  );
}
