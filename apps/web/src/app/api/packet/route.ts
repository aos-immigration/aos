import { proxyPdf } from "@/app/lib/pdfProxy";

export async function POST() {
  return proxyPdf("packet");
}
