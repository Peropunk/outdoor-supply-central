import type { Metadata } from "next";
import { SellFlow } from "./SellFlow";

export const metadata: Metadata = { title: "Sell your gear" };

export default function SellPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <SellFlow />
    </div>
  );
}
