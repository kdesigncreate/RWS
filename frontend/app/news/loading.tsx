import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-16 sm:pt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
