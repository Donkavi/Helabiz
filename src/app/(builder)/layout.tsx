import { requireUser } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { getLang } from "@/lib/i18n/server";
import { LangProvider } from "@/lib/i18n/provider";
import { User } from "@/models/User";
import { TourProvider } from "@/components/dashboard/tour/tour";

/**
 * The builder is full-screen, outside the dashboard chrome, but it shares the
 * dashboard's language and its guided tour — the screen a first-time owner is
 * most likely to need one on.
 */
export default async function BuilderLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const lang = await getLang();
  await connectDB();
  const account = await User.findById(user.id).select("toursSeen").lean();

  return (
    <LangProvider lang={lang}>
      <TourProvider seen={account?.toursSeen ?? []} floatingHelp={false}>
        {children}
      </TourProvider>
    </LangProvider>
  );
}
