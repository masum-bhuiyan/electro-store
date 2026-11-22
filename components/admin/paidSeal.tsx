// "PAID" সিল। বাকি ০ হলে মেমোতে দেখানো হয়
export default function PaidSeal() {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="Paid"
            className="h-40 w-40 -rotate-12 text-[#038CD4] opacity-85"
    >
      <defs>
        <path id="sealArcTop" d="M 34,100 A 66,66 0 0 1 166,100" />
        <path id="sealArcBottom" d="M 25,100 A 75,75 0 0 0 175,100" />
      </defs>

      <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="5" />
      <circle cx="100" cy="100" r="86" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="58" fill="none" stroke="currentColor" strokeWidth="1.5" />

      <text fill="currentColor" fontSize="15" fontWeight="700" letterSpacing="2">
        <textPath href="#sealArcTop" startOffset="50%" textAnchor="middle">
          THANK YOU
        </textPath>
      </text>
      <text fill="currentColor" fontSize="15" fontWeight="700" letterSpacing="2">
        <textPath href="#sealArcBottom" startOffset="50%" textAnchor="middle">
          THANK YOU
        </textPath>
      </text>

      <line x1="40" y1="76" x2="160" y2="76" stroke="currentColor" strokeWidth="3" />
      <line x1="40" y1="126" x2="160" y2="126" stroke="currentColor" strokeWidth="3" />
      <text
        x="100"
        y="112"
        textAnchor="middle"
        fill="currentColor"
        fontSize="42"
        fontWeight="800"
      >
        PAID
      </text>
    </svg>
  );
}