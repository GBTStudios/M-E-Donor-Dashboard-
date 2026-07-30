import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import ImpactStatsSection from "@/components/landing/ImpactStatsSection";
import ImpactStoriesSection from "@/components/landing/ImpactStoriesSection";
import FAQSection from "@/components/landing/FAQSection";
import LandingFooter from "@/components/landing/LandingFooter";
import ChatbotButton from "@/components/landing/ChatbotButton";
import { fetchStories } from "@/lib/landing-data";

export default async function LandingPage() {
  const stories = await fetchStories(6);

  return (
    <main>
      <LandingHeader />
      <HeroSection />
      <ImpactStatsSection />
      <ImpactStoriesSection stories={stories} />
      <FAQSection />
      <LandingFooter />
      <ChatbotButton />
    </main>
  );
}