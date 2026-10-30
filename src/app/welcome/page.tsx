import type { Metadata } from "next";
import { Questionnaire } from "./Questionnaire";

export const metadata: Metadata = { title: "Welcome" };

export default function WelcomePage() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-10">
      <h1 className="text-3xl">Welcome to Outdoor Supply Central</h1>
      <p className="mt-2 text-muted">Three quick questions and you&apos;re in.</p>
      <Questionnaire />
    </div>
  );
}
