import ImmersiveJourney from "@/components/home/ImmersiveJourney";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-grow">
        <ImmersiveJourney />
      </main>
      <Footer />
    </div>
  );
}
