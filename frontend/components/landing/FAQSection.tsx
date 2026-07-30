"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "How does Groundbreaker measure its impact?",
    answer:
      "Groundbreaker operates a longitudinal monitoring, evaluation, and learning (MEL) system that tracks every participant across all cohorts, from baseline entry through graduation and into their post-programme careers. Data is collected through baseline, endline, and follow-up surveys, consolidated into a single verified database managed by the MEL Lead in Germany in close coordination with the Ugandan implementation team.",
  },
  {
    question: "What exactly does Groundbreaker measure?",
    answer:
      "The MEL system tracks graduation rates, employment rates, income change from baseline to post-programme, sector and employer placement, geographic distribution of employers, continuing education uptake, and household-level effects. Net self-reported income serves as the headline economic indicator.",
  },
  {
    question: "How is data quality ensured?",
    answer:
      "Every dataset passes through a structured verification process before being used in reporting. Field-level checks are conducted by the Ugandan team, followed by cross-verification against source records and consistency checks by the MEL Lead in Germany. Methodology decisions and corrections are documented so reported figures are traceable and defensible.",
  },
  {
    question: "How long do you track graduates after they leave the programme?",
    answer:
      "Groundbreaker tracks graduates on an ongoing basis through follow-up surveys, capturing employment status, income, and career progression. Older cohorts remain in the tracking system, building a longitudinal view of career trajectories over multiple years.",
  },
  {
    question: "How comparable is data across cohorts?",
    answer:
      "Data collected from Cohort 4 onwards is fully comparable, using standardised instruments and consistent methodology. Earlier cohorts (1 to 3) were tracked with different instruments, and their baseline figures are preserved as originally recorded. Groundbreaker is transparent about these methodological differences in all reporting.",
  },
  {
    question: "Do you track family or community-level impact?",
    answer:
      "Yes. Structured family interviews are conducted with parents, guardians, and siblings to document changes in household income contribution, siblings' education, healthcare access, and family stability, complementing the quantitative outcomes.",
  },
  {
    question: "Is your MEL system externally audited or reviewed?",
    answer:
      "Groundbreaker's financial data is externally audited, and MEL methodology is documented for donor review. The organisation is open to independent MEL reviews and welcomes donor engagement on evaluation frameworks.",
  },
  {
    question: "Can donors access your raw data?",
    answer:
      "Groundbreaker shares aggregated MEL findings in donor reports and can provide additional breakdowns on request. Individual-level data is protected under participant consent agreements and data protection principles, and is not shared externally in identifiable form.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-[#f5efe4] py-20">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-500 mt-4 max-w-sm">
            Got questions about our methodology or platform? We&apos;ve got answers. Learn
            more about how we handle data privacy and reporting standards.
          </p>
        </div>

        <div className="divide-y divide-black/10">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question} className="py-4">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="text-sm font-medium text-gray-800">{item.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="text-sm text-gray-500 mt-3 pr-6">{item.answer}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}