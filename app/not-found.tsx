import Link from "next/link";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";
import { ConsultCta } from "@/components/site/consult-cta";

export default function NotFound() {
  return (
    <Container className="py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 font-serif text-4xl text-charcoal sm:text-5xl">
        This page took a detour.
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-muted">
        The page you&apos;re looking for isn&apos;t here. If you&apos;re trying
        to plan a trip, the fastest way is still the $10 call.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ConsultCta size="lg" />
        <Button asChild variant="secondary" size="lg">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </Container>
  );
}
