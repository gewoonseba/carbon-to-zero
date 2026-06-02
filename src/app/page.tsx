import { getSavingsData } from "@/lib/data";
import { CarbonStory } from "@/components/carbon-story";

export default function Home() {
  const data = getSavingsData();
  return <CarbonStory data={data} />;
}
