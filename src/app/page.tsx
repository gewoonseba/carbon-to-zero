import { getEmissionsData } from "@/lib/data";
import { CarbonStory } from "@/components/carbon-story";

export default function Home() {
  const data = getEmissionsData();
  return <CarbonStory data={data} />;
}
