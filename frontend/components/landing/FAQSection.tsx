"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "How is data collected on the ground?",
    answer:
      "Field teams at each partner site log participant outcomes directly into the platform at intake, during the programme, and at graduation, using structured forms designed with our M&E team.",
  },
  {
    question: "What is the role of AI in verification?",
    answer:
      "AI cross-checks submitted records against historical patterns and flags anomalies for human review, rather than replacing human verification entirely.",
  },
  {
    question: "How often is the donor dashboard updated?",
    answer:
      "Participant-level records update as field teams submit them. Aggregate landing page statistics are refreshed periodically by our team, typically every few months.",
  },
  {
    question: "Is participant data kept anonymous?",
    answer:
      "Yes. Donor-facing dashboards and public pages only ever show aggregated or de-identified data — individual records are never exposed publicly.",
  },
  {
    question: "Who verifies the reported outcomes?",
    answer:
      "Outcomes are verified through a combination of field team sign-off, automated anomaly detection, and periodic independent spot checks.",
  },
  {
    question: "Can I download the raw data?",
    answer:
      "Aggregated impact reports are available on request. Raw participant-level data is not available publicly, in order to protect participant privacy.",
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