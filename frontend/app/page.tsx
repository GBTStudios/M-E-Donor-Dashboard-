import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import ImpactStatsSection from "@/components/landing/ImpactStatsSection";
import ImpactStoriesSection from "@/components/landing/ImpactStoriesSection";
import FAQSection from "@/components/landing/FAQSection";
import LandingFooter from "@/components/landing/LandingFooter";
import ChatbotButton from "@/components/landing/ChatbotButton";
import { fetchStories, fetchLandingStats } from "@/lib/landing-data";

export default async function LandingPage() {
  const [stories, stats] = await Promise.all([fetchStories(6), fetchLandingStats()]);

  return (
    <main>
      <LandingHeader />
      <HeroSection stats={stats} />
      <ImpactStatsSection stats={stats} />
      <ImpactStoriesSection stories={stories} />
      <FAQSection />
      <LandingFooter />
      <ChatbotButton />
    </main>
  );
}
