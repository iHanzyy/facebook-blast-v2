import { PosterDashboard } from "@/components/poster-dashboard";
import { getGroups } from "@/lib/groups";

export default function Home() {
  return <PosterDashboard groups={getGroups()} />;
}
