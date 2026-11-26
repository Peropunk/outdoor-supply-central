import Link from "next/link";
import type { ReactNode } from "react";
import { formatUSD, sellerEarnings } from "@/lib/money";
import { SHIP_BY_DAYS, SHIP_REMINDER_DAY } from "@/lib/catalog";

// Terms of Use and Privacy Policy: JD's final text (Nov 26, 2026), with only
// typo fixes and the technical details he asked us to confirm. The selling fee
// and ship-by numbers come from the same settings the site uses, so the terms
// always match how it works. Change the effective date when the text changes.

export const LEGAL_EFFECTIVE_DATE = "December 8, 2026";

function Effective() {
  return <p className="text-[15px] text-muted">Effective date: {LEGAL_EFFECTIVE_DATE}</p>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 pt-2">
      <h2 className="text-xl">{title}</h2>
      {children}
    </section>
  );
}

function Sub({ children }: { children: ReactNode }) {
  return <h3 className="pt-1 text-lg font-semibold">{children}</h3>;
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1 pl-6">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Address() {
  return (
    <address className="not-italic">
      Outdoor Central, LLC
      <br />
      5900 Balcones Drive, Ste 100
      <br />
      Austin, TX 78731
      <br />
      <a href="mailto:help@outdoorsupplycentral.com">help@outdoorsupplycentral.com</a>
    </address>
  );
}

const fees = <Link href="/help/fees">Fees</Link>;
const shipping = <Link href="/help/shipping">Shipping</Link>;
const banned = <Link href="/help/banned-items">Banned Items</Link>;
const returns = <Link href="/help/returns">Returns and Problems</Link>;
const privacy = <Link href="/help/privacy">Privacy Policy</Link>;

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const words = (n: number) => NUMBER_WORDS[n] ?? String(n);

export function termsBody(rate: number): ReactNode {
  const pct = `${Math.round(rate * 10_000) / 100}%`;
  return (
    <>
      <Effective />
      <p>Outdoor Supply Central is operated by Outdoor Central, LLC (“Outdoor Central,” “we,” “us,” or “our”).</p>
      <p>
        These Terms govern your use of Outdoor Supply Central, including buying and selling through the marketplace. By
        creating an account or completing a transaction through a process that asks you to accept these Terms, you agree
        to them.
      </p>
      <p>
        Our {fees}, {shipping}, {banned}, and {returns} policies form part of these Terms. Our {privacy} explains how we
        collect, use, and share personal information.
      </p>

      <Section title="1. Who we are">
        <p>
          Outdoor Supply Central is a marketplace connecting independent buyers and sellers of preowned camping, hiking,
          fishing, and other outdoor gear.
        </p>
        <p>
          The contract for each item’s sale is between the buyer and the seller. Outdoor Central is not the seller of
          member-listed items.
        </p>
        <p>
          We provide the marketplace technology, facilitate payment processing through Stripe, and arrange access to
          prepaid USPS shipping labels. We also carry out the automatic cancellation and refund process described below.
        </p>
        <p>
          We do not own, possess, inspect, test, authenticate, certify, package, or ship member-listed items. A
          listing’s appearance on our site does not constitute our endorsement or a guarantee of its condition, safety,
          authenticity, or suitability.
        </p>
        <p>Nothing in these Terms excludes responsibilities or rights that cannot lawfully be excluded.</p>
      </Section>

      <Section title="2. Eligibility and your account">
        <p>
          You must be at least 18 years old, located in the United States, and legally able to enter into a binding
          agreement to buy or sell through the marketplace.
        </p>
        <p>
          You must provide accurate information and keep it current. Sellers must complete the identity, banking, tax,
          and other verification required by Stripe or reasonably requested by us.
        </p>
        <p>
          We use email sign-in links. Keep your email account secure, do not share sign-in links, and notify us promptly
          if you suspect unauthorized access.
        </p>
        <p>
          You are responsible for the activity you authorize through your account and for taking reasonable steps to
          protect it.
        </p>
        <p>
          You may not impersonate another person, use an account without authorization, or create accounts to avoid a
          suspension or other restriction.
        </p>
      </Section>

      <Section title="3. Seller responsibilities">
        <p>
          You may list only items that you own or are legally authorized to sell, have in your possession, and can ship
          from the United States using our supported USPS service.
        </p>
        <p>You are responsible for:</p>
        <List
          items={[
            "Accurately describing the actual item being sold.",
            "Using accurate photographs that you own or have permission to use.",
            "Selecting a fair condition grade.",
            "Disclosing known defects, damage, repairs, modifications, missing components, and material wear.",
            "Disclosing known safety concerns and relevant expiration or manufacturer retirement dates.",
            "Providing accurate packed weight and dimensions.",
            "Packaging the item appropriately.",
            "Shipping by the deadline shown on the order.",
            "Complying with applicable laws and our marketplace policies.",
          ]}
        />
        <p>
          Do not make claims about an item’s safety, authenticity, certification, or performance without a reasonable
          basis.
        </p>
        <p>
          Keep your listings current and remove items that are no longer available. Do not list an item that you cannot
          fulfill if purchased.
        </p>
        <p>
          You remain responsible for your listing and fulfillment obligations even though Stripe processes the payment
          and USPS transports the package.
        </p>
      </Section>

      <Section title="4. Prohibited items">
        <p>You must comply with our {banned} Policy.</p>
        <p>Prohibited items include:</p>
        <List
          items={[
            "Firearms, firearm parts, and ammunition.",
            "Fuel canisters, lighter fluid, and other flammable liquids or gases prohibited by our policy.",
            "Bear spray, pepper spray, and other restricted aerosols.",
            "Fireworks, flares, and explosives.",
            "Broken or parts-only gear.",
            "Live bait and perishable products.",
            "Stolen or counterfeit products.",
            "Recalled products.",
            "Products with concealed safety defects or undisclosed structural damage.",
            "Items otherwise prohibited by applicable law, our supported shipping service, our payment processor, or our published policies.",
          ]}
        />
        <p>Our restrictions may be stricter than what a carrier or applicable law would otherwise permit.</p>
        <p>
          We may remove prohibited listings, cancel affected transactions, and restrict or close accounts. Do not ship
          an item after we notify you that the transaction has been cancelled or shipment is prohibited.
        </p>
      </Section>

      <Section title="5. Buying items">
        <p>
          Review the listing, photographs, condition description, item price, shipping charges, and applicable policies
          before purchasing.
        </p>
        <p>
          Your order total includes the item price, shipping, applicable taxes, and any other charges disclosed before
          you place the order.
        </p>
        <p>Payment is processed through Stripe when you order.</p>
        <p>
          Used products may have wear and limitations. Sellers are responsible for accurately disclosing their
          condition. Do not use an item that appears unsafe or materially different from its description.
        </p>
        <p>Purchases are final except for:</p>
        <List
          items={[
            "Automatic cancellations and refunds under Section 8.",
            <>Returns or refunds expressly available under our {returns} Policy.</>,
            "Any additional return arrangement the buyer and seller agree to through the site.",
            "Rights or remedies available under applicable law or applicable payment-provider rules.",
          ]}
        />
      </Section>

      <Section title="6. Fees and taxes">
        <p>Listing an item is free.</p>
        <p>
          When an item sells, we charge the seller {pct} of the item price. The selling fee is not calculated on
          shipping charges or sales taxes. We cover standard card-processing fees.
        </p>
        <p>
          For example, an item sold for {formatUSD(10000)} produces {formatUSD(sellerEarnings(10000, rate))} in seller
          proceeds before any adjustments permitted under these Terms.
        </p>
        <p>
          The buyer pays the shipping amount shown at checkout. Ordinary shipping charges do not reduce the seller’s
          share of the item price. Seller-caused postage adjustments are addressed in Section 9.
        </p>
        <p>
          If we automatically cancel an order under Section 8, the buyer receives a full refund of the order total, the
          seller receives no proceeds, and we do not charge the seller our {pct} selling fee for that cancelled order.
        </p>
        <p>Our {fees} Policy explains the treatment of selling fees for other refunds and adjustments.</p>
        <p>
          We collect and remit transaction taxes where required by applicable law. Sellers must provide accurate
          information reasonably needed for tax administration and reporting. Sellers remain responsible for their own
          income taxes and other obligations not assumed by us.
        </p>
      </Section>

      <Section title="7. Payments and seller proceeds">
        <p>
          Payments and seller payouts are processed through Stripe. Sellers must complete the required Stripe setup
          before listing. Applicable Stripe agreements also govern their use of Stripe’s services.
        </p>
        <p>
          Seller proceeds become eligible for release when USPS tracking records a qualifying acceptance event showing
          that USPS has taken possession of the package.
        </p>
        <p>
          Creating or printing a label, or a tracking status showing only that shipment information has been received,
          does not qualify as USPS acceptance.
        </p>
        <p>
          Release is subject to payment availability, identity verification, fraud review, applicable holds, payment
          disputes, and requirements imposed by Stripe or applicable law.
        </p>
        <p>
          Becoming eligible for release does not mean funds will arrive immediately in the seller’s bank account. Stripe
          sends eligible funds according to the applicable payout schedule, and bank arrival times vary.
        </p>
        <p>
          We may delay or restrict release of amounts reasonably related to suspected fraud, an outstanding transaction
          issue, an amount properly owed by the seller, or a legal or payment-processor requirement.
        </p>
      </Section>

      <Section title="8. Shipping deadlines and automatic cancellation">
        <p>
          Every order must be shipped using the prepaid USPS label provided for that order unless we expressly authorize
          otherwise.
        </p>
        <p>
          We email the label to the seller and make it available on the order page. Where a compatible USPS Label Broker
          QR code is provided, the seller may take the sealed package and code to a participating USPS location.
          Alternatively, the seller may print and securely attach the PDF label.
        </p>
        <Sub>Ship-by deadline</Sub>
        <p>
          USPS must accept the package within {words(SHIP_BY_DAYS)} calendar days after purchase, by the exact ship-by
          deadline displayed on the order.
        </p>
        <p>Printing a label does not count as shipping.</p>
        <p>
          We generally send a reminder on day {words(SHIP_REMINDER_DAY)}. Not receiving a reminder does not extend the
          deadline.
        </p>
        <p>
          Because cancellation depends on tracking information, sellers should present packages at a USPS counter,
          obtain an acceptance scan, and keep the receipt.
        </p>
        <Sub>Automatic cancellation and full refund</Sub>
        <p>
          If USPS tracking has not recorded a qualifying acceptance event by the ship-by deadline, our system
          automatically:
        </p>
        <List
          items={[
            "Cancels the order.",
            "Initiates a full refund of the buyer’s order total, including shipping and any taxes collected.",
            "Requests cancellation or voiding of the unused shipping label.",
          ]}
        />
        <p>The seller receives no proceeds from the cancelled order.</p>
        <p>
          Refund initiation does not mean the funds will immediately appear in the buyer’s account. Posting times depend
          on Stripe, the payment method, and the buyer’s financial institution.
        </p>
        <Sub>Do not ship cancelled orders</Sub>
        <p>
          Check the order status before handing a package to USPS. Do not use the label or ship the item after
          cancellation.
        </p>
        <p>
          If you handed the package to USPS before cancellation but tracking did not show acceptance, contact us
          promptly and provide your acceptance receipt or other available evidence.
        </p>
        <p>
          A delayed or missing scan does not automatically reverse a cancellation, stop a refund, or authorize us to
          charge the buyer again.
        </p>
        <p>
          If you ship after cancellation, you may lose both the item and payment. We do not guarantee recovery of the
          package or payment.
        </p>
        <p>
          A cancelled item must not be relisted unless the seller confirms that it remains in their possession and is
          available for sale.
        </p>
      </Section>

      <Section title="9. Packaging and shipping adjustments">
        <p>
          Sellers must choose a package size, which sets the box and maximum weight. Sellers are responsible for
          choosing the correct package size, packing within its box size and weight limit, using suitable packaging, and
          complying with the requirements of the USPS service shown on the label.
        </p>
        <p>
          Use each label only for its assigned order and ship to the address shown on that order. Do not independently
          substitute a different address or shipping method.
        </p>
        <p>
          Sellers are responsible for documented additional postage or shipping charges resulting from inaccurate
          package information, unsuitable packaging, label misuse, or failure to follow shipping instructions.
        </p>
        <p>
          Buyers and sellers must reasonably cooperate with carrier inquiries and claims, including providing
          photographs, packaging, receipts, or other relevant evidence.
        </p>
        <p>
          Our provision of a label does not mean that we pack, transport, inspect, or guarantee delivery of the item.
        </p>
      </Section>

      <Section title="10. Product issues and disputes between members">
        <p>
          Buyers and sellers are responsible for communicating through the site and attempting to resolve issues
          involving descriptions, condition, missing components, and other product-related concerns.
        </p>
        <p>
          Our {returns} Policy explains the reporting process and any remedies offered through the marketplace.
          Reporting a problem does not, by itself, guarantee a refund.
        </p>
        <p>
          Except for our automatic cancellation process and any other remedy expressly promised in our published
          policies, we do not provide general mediation, guarantee a resolution, or undertake to decide every dispute.
        </p>
        <p>
          We may assist with communication, request information, investigate policy violations, or take action to
          protect the marketplace. Providing assistance in one case does not create a promise to provide the same
          assistance in every case.
        </p>
        <p>
          Do not return an item without an agreed or otherwise authorized return process. Buyers and sellers should
          document any resolution through site messaging.
        </p>
        <p>Nothing in this section limits rights under applicable law or applicable payment-provider rules.</p>
      </Section>

      <Section title="11. Refunds, reversals, and amounts owed by sellers">
        <p>
          Receiving a payout does not eliminate a seller’s responsibility for amounts properly owed in connection with a
          transaction.
        </p>
        <p>
          These amounts may include applicable refunds, payment reversals, chargebacks, documented postage adjustments,
          and other charges disclosed in our policies.
        </p>
        <p>
          To the extent permitted by law and supported by our payment-processing arrangements, sellers authorize us to
          recover amounts properly owed by:
        </p>
        <List
          items={[
            "Reversing transfers.",
            "Deducting from available or future seller proceeds.",
            "Applying an authorized reserve.",
            "Requesting direct repayment.",
          ]}
        />
        <p>
          We will provide reasonable information about the basis for an adjustment or repayment request. We will not
          recover the same amount twice.
        </p>
        <p>Account closure does not eliminate outstanding obligations.</p>
      </Section>

      <Section title="12. Prohibited conduct">
        <p>You must not:</p>
        <List
          items={[
            "Use the marketplace for fraud or unlawful activity.",
            "Post misleading descriptions, photographs, or claims.",
            "Arrange off-site payment or delivery to avoid marketplace fees or rules for an item found through the site.",
            "Harass, threaten, or abuse another person.",
            "Manipulate orders, tracking, reviews, refunds, or payment disputes.",
            "Collect or use another member’s information for unrelated marketing or other unauthorized purposes.",
            "Access accounts or systems without permission.",
            "Introduce malicious software or interfere with site operation.",
            "Evade account restrictions or assist another person in doing so.",
          ]}
        />
        <p>
          Use transaction-related personal information only as reasonably necessary to complete the order, resolve a
          related issue, or comply with law.
        </p>
      </Section>

      <Section title="13. Listing content">
        <p>You retain ownership of the photographs, descriptions, and other content you submit.</p>
        <p>
          You grant us a nonexclusive, royalty-free license to host, store, reproduce, resize, format, and display that
          content as reasonably necessary to operate the marketplace and promote your listings.
        </p>
        <p>You represent that you have the rights necessary to submit the content and grant this permission.</p>
        <p>
          We may remove content that violates these Terms. We may retain relevant records as reasonably necessary for
          security, legal compliance, transaction administration, and disputes, consistent with our {privacy}.
        </p>
      </Section>

      <Section title="14. Account restrictions and closure">
        <p>
          We may remove listings, request verification, restrict features, suspend accounts, or close accounts when
          reasonably necessary to address suspected violations, fraud, safety concerns, legal requirements, or risks to
          the marketplace.
        </p>
        <p>Where appropriate and legally permitted, we will provide notice and a way to contact us about the action.</p>
        <p>
          Members can delete their own account in <Link href="/account">Account settings</Link>. Closing an account does
          not automatically cancel open orders, erase transaction records, or eliminate outstanding obligations.
        </p>
        <p>Open orders remain subject to these Terms and may be fulfilled, cancelled, or refunded as appropriate.</p>
      </Section>

      <Section title="15. Disclaimers">
        <p>
          To the fullest extent permitted by applicable law, the marketplace is provided “as is” and “as available,”
          without implied warranties of merchantability, fitness for a particular purpose, or noninfringement.
        </p>
        <p>
          We do not guarantee uninterrupted access, error-free operation, or the accuracy of member-provided content.
        </p>
        <p>
          We do not warrant or certify the condition, authenticity, safety, legality, or suitability of member-listed
          products.
        </p>
        <p>
          Outdoor equipment can present serious risks when damaged, worn, misused, or unsuitable for the intended
          activity. Do not rely on a listing or condition grade as a safety certification.
        </p>
        <p>
          These disclaimers do not eliminate our express commitments under these Terms or rights that cannot lawfully be
          excluded.
        </p>
      </Section>

      <Section title="16. Limitation of liability">
        <p>
          To the fullest extent permitted by applicable law, Outdoor Central, LLC will not be liable for indirect,
          incidental, special, consequential, or punitive damages, including lost profits, arising from use of the
          marketplace.
        </p>
        <p>
          We do not assume a seller’s product or fulfillment obligations merely because we provide marketplace
          technology, payment-processing arrangements, or shipping-label access.
        </p>
        <p>Nothing in these Terms excludes liability or remedies that cannot lawfully be excluded.</p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, YOU UNDERSTAND AND AGREE THAT IN NO EVENT WILL OUTDOOR CENTRAL, LLC,
          OUR SUBSIDIARIES AND AFFILIATES, AND THE RESPECTIVE OFFICERS, DIRECTORS, AGENTS, PARTNERS AND EMPLOYEES OF
          EACH (THE “OUTDOOR CENTRAL PARTIES”) BE LIABLE TO YOU UNDER ANY THEORY OF LIABILITY—WHETHER THE CLAIM IS BASED
          IN CONTRACT, TORT INCLUDING NEGLIGENCE, STRICT LIABILITY, OR OTHERWISE—FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          EXEMPLARY, CONSEQUENTIAL DAMAGES, OR LOST PROFITS ARISING OUT OF OR RELATING TO THIS AGREEMENT OR THE SERVICE,
          OR ANY ITEMS YOU PURCHASE OR SELL THROUGH THE SERVICE, WHETHER OR NOT AN OUTDOOR CENTRAL PARTY HAS BEEN
          ADVISED OF THE POSSIBILITY OF SUCH DAMAGES, OR FOR ANY DAMAGES FOR PERSONAL OR BODILY INJURY OR EMOTIONAL
          DISTRESS ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT, OR FROM ANY COMMUNICATIONS, INTERACTIONS OR
          MEETINGS WITH OTHER USERS OF THE SERVICE, ON ANY THEORY OF LIABILITY (INCLUDING CONTRACT; TORT INCLUDING
          NEGLIGENCE OR OTHERWISE) ARISING OUT OF, IN CONNECTION WITH, OR RESULTING FROM (1) THE USE OR INABILITY TO USE
          THE SERVICE; (2) STATEMENTS OR CONDUCT OF ANY THIRD PARTY ON THE SERVICE; OR (3) ANY OTHER MATTER RELATED TO
          THE SERVICE.
        </p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, UNDER NO CIRCUMSTANCES WILL THE TOTAL LIABILITY OF THE OUTDOOR CENTRAL
          PARTIES TO YOU FOR ANY CLAIM ARISING OUT OF OR RELATING TO THIS AGREEMENT OR THE SERVICE, REGARDLESS OF THE
          FORM OF THE ACTION, EXCEED THE GREATER AMOUNT OF (1) COMMISSIONS/FEES THAT YOU HAVE PAID TO OUTDOOR CENTRAL AS
          A SELLER IN THE SIX (6) MONTHS PRIOR TO THE APPLICABLE CLAIM OR (2) ONE HUNDRED U.S. DOLLARS (USD $100).
        </p>
        <p>
          THE LIMITATIONS OF THIS SECTION WILL NOT LIMIT OR EXCLUDE LIABILITY FOR THE GROSS NEGLIGENCE, FRAUD, OR
          INTENTIONAL MISCONDUCT OF THE OUTDOOR CENTRAL PARTIES OR ANY OTHER LIABILITY THAT CANNOT BE EXCLUDED OR
          LIMITED BY LAW. Our licensors and service providers will have no liability of any kind under this Agreement.
          Unless such restriction is prohibited by applicable law, you may not bring any claim under this Agreement more
          than twelve (12) months after the cause of action arises.
        </p>
      </Section>

      <Section title="17. Governing law and legal disputes">
        <p>If we get sued because of something you did, then you agree to defend and indemnify us.</p>
        <p>
          You agree to release, indemnify, and hold harmless and, upon Outdoor Central’s request, defend the Outdoor
          Central Parties from any legal claims, demands and damages (including reasonable attorney fees) that arise
          from or relate to (i) your access to or use of the Service, including any Items purchased or sold; (ii) your
          User Content or Feedback; (iii) your breach of the Agreement; (iv) your violation, misappropriation, or
          infringement of any rights of another (including someone else’s privacy or intellectual property rights); or
          (v) your violation of applicable laws. If you are a California resident, you waive California Civil Code
          Section 1542, which states, “A general release does not extend to claims which the creditor does not know or
          suspect to exist in his favor at the time of executing the release, which if known by him must have materially
          affected his settlement with the debtor.” If you are a resident of another jurisdiction, you waive any
          comparable statute or doctrine.
        </p>
        <p>
          We hope to amicably resolve any disputes with you, so we strongly encourage you to first contact our support
          team at <a href="mailto:help@outdoorsupplycentral.com">help@outdoorsupplycentral.com</a>. Any unresolved
          dispute will be settled by binding arbitration.
        </p>
        <p>
          PLEASE READ THIS SECTION CAREFULLY BECAUSE IT REQUIRES YOU AND OUTDOOR CENTRAL TO ARBITRATE CERTAIN DISPUTES
          AND CLAIMS AND LIMITS THE MANNER IN WHICH WE CAN SEEK RELIEF FROM EACH OTHER. ARBITRATION PRECLUDES YOU AND
          OUTDOOR CENTRAL FROM SUING IN COURT OR HAVING A JURY TRIAL. YOU AND OUTDOOR CENTRAL AGREE THAT ARBITRATION
          WILL BE SOLELY ON AN INDIVIDUAL BASIS AND NOT AS A CLASS ARBITRATION, CLASS ACTION, OR ANY OTHER KIND OF
          REPRESENTATIVE PROCEEDING. OUTDOOR CENTRAL AND YOU ARE EACH WAIVING THE RIGHT TO TRIAL BY A JURY.
        </p>
        <p>
          FOLLOW THE INSTRUCTIONS BELOW IF YOU WISH TO OPT OUT OF THE REQUIREMENT OF ARBITRATION ON AN INDIVIDUAL BASIS.
        </p>

        <Sub>a. Informal Dispute Resolution Prior to Arbitration</Sub>
        <p>
          For any dispute or claim that you have against Outdoor Central or that Outdoor Central has against you arising
          out of or related to this Agreement or access to or use of the Service, including any Items purchased or sold
          (collectively, “Claims”, and each a “Claim”), you and Outdoor Central will attempt to first resolve the Claim
          informally to resolve the Claim faster and reduce costs for both parties.
        </p>
        <p>
          You and Outdoor Central will make a good-faith effort to negotiate the resolution of any Claim for at least
          sixty (60) days (“Informal Resolution”). This 60-day period starts on the day you or Outdoor Central receive a
          written notice of a claim from the other party (a “Notice of Claim”) in accordance with this Agreement. The
          Notice of Claim sent by either party must include the initiating party’s name, address, phone number, email
          address, a description of the Claim (including any relevant account names, order numbers, items purchased, and
          services used), the dates and manner of access to Outdoor Central upon which the Claim is based, and the
          specific resolution being sought. A Notice of Claim will only be valid if it pertains to, and is on behalf of,
          a single individual. If requested by the party that receives the Notice of Claim, the other party must
          personally appear at and participate in a video conference to discuss the Claim (if a party is represented by
          counsel, counsel may also participate). During the videoconference, you and Outdoor Central agree to
          participate in a good faith, direct discussion about the facts, circumstances, and potential resolution of the
          Claim.
        </p>
        <p>
          If the Claim is not resolved within Informal Resolution period of sixty (60) days (which period can be
          extended by agreement of the parties), you or Outdoor Central may start an arbitration in accordance with this
          Agreement (or, at the option of either party, commence a proceeding in small claims court).
        </p>
        <p>
          You and Outdoor Central agree that this informal dispute resolution procedure is a condition precedent to
          initiating any arbitration or filing any claim against the other party.
        </p>

        <Sub>b. Claims Subject to Binding Arbitration; Exceptions</Sub>
        <p>
          Except for individual disputes that qualify for small claims court, all Claims, whether based in contract,
          tort, statute, fraud, misrepresentation, or any other legal theory, that are not resolved through informal
          dispute resolution will be resolved by a neutral arbitrator through final and binding arbitration instead of
          in a court by a judge or jury. Such Claims include disputes arising out of or relating to interpretation or
          application of this arbitration provision, including the enforceability, revocability, or validity of the
          arbitration provision or any portion of the arbitration provision. The arbitrator will have the authority to
          grant any remedy or relief that would otherwise be available in court.
        </p>

        <Sub>c. Federal Arbitration Act</Sub>
        <p>
          This Agreement affects interstate commerce, and the enforceability of this will be substantively and
          procedurally governed by the Federal Arbitration Act, 9 U.S.C. § 1, et seq., to the extent permitted by law.
          As limited by the FAA, this Agreement, and the JAMS Rules (as defined below), the arbitrator will have
          exclusive authority to make all procedural and substantive decisions regarding any dispute and to grant any
          remedy that would otherwise be available in court, including the power to determine the question of
          arbitrability.
        </p>

        <Sub>d. Arbitration Procedure</Sub>
        <p>
          All Claims must be submitted to JAMS and will be resolved through binding arbitration before one arbitrator.
          JAMS administers arbitration pursuant to JAMS’ Comprehensive Arbitration Rules and Procedures or pursuant to
          JAMS’ Streamlined Arbitration Rules and Procedures (“JAMS Rules”). The JAMS Rules are available online at{" "}
          <a href="https://www.jamsadr.com" target="_blank" rel="noopener noreferrer">
            www.jamsadr.com
          </a>
          .
        </p>
        <p>
          You or Outdoor Central may commence arbitration by filing a written Demand for Arbitration with JAMS and
          providing a copy to the other party. The party commencing arbitration shall (i) include in their demand
          details about the claim sufficient to identify their interactions and transactions with the other party
          (including dates and transaction amounts) in a manner that is specific to the party (and thus not a
          superficial or generic statement of the claim of the sort that may be applicable to any number of claimants)
          and (ii) attach the Notice of Claim and any response thereto. The parties shall be responsible for their own
          attorneys’ fees and costs in arbitration, unless the arbitration rules and/or applicable law provide
          otherwise.
        </p>
        <p>
          YOU AND OUTDOOR CENTRAL AGREE THAT ANY ARBITRATION UNDER THIS AGREEMENT WILL TAKE PLACE ON AN INDIVIDUAL
          BASIS; CLASS ARBITRATIONS AND CLASS ACTIONS ARE NOT PERMITTED, AND YOU AND OUTDOOR CENTRAL ARE AGREEING TO
          GIVE UP THE ABILITY TO PARTICIPATE IN A CLASS ACTION. The arbitrator may conduct only an individual
          arbitration and may not consolidate more than one individual’s claims, preside over any type of class or
          representative proceeding, or preside over any proceeding involving more than one individual.
        </p>
        <p>
          You and Outdoor Central agree to cooperate to seek from the arbitrator protection for any confidential,
          proprietary, trade secret, or otherwise sensitive information, documents, testimony, and/or other materials
          that might be exchanged or the subject of discovery in the arbitration. You and Outdoor Central agree to seek
          such protection before any such information, documents, testimony, and/or materials are exchanged or otherwise
          become the subject of discovery in the arbitration.
        </p>
        <p>
          The arbitrator’s decision will follow this Agreement and will be final and binding. The arbitrator will have
          authority to award temporary, interim or permanent injunctive relief or relief providing for specific
          performance of this Agreement, but only to the extent necessary to provide relief warranted by the individual
          claim before the arbitrator. The award rendered by the arbitrator may be confirmed and enforced in any court
          having jurisdiction thereof. Notwithstanding any of the foregoing, nothing in this Agreement will preclude you
          from bringing issues to the attention of federal, state or local agencies and, if the law allows, they can
          seek relief against us for you.
        </p>

        <Sub>e. Opting Out of Arbitration</Sub>
        <p>
          You have the right to opt out of binding arbitration within thirty (30) days of the date you first accepted
          this Agreement by providing us with notice of your decision to opt-out via email at{" "}
          <a href="mailto:admin@outdoorsupplycentral.com">admin@outdoorsupplycentral.com</a>. To be effective, the
          opt-out notice must include your full name, mailing address, account name, and email address. The notice must
          also clearly indicate your intent to opt out of binding arbitration. By opting out of binding arbitration, you
          are agreeing to resolve disputes in accordance with Section 17.
        </p>

        <Sub>f. Severability</Sub>
        <p>
          If any portion of this Section is found to be unenforceable or unlawful for any reason, including but not
          limited to, because it is found to be unconscionable, (i) the unenforceable or unlawful provision will be
          severed from this Agreement; (ii) severance of the unenforceable or unlawful provision will have no impact
          whatsoever on the remainder of this Section or the parties’ ability to compel arbitration of any remaining
          claims on an individual basis pursuant to this Section; and to the extent that any claims must therefore
          proceed on a class, collective, consolidated, or representative basis, such claims must be litigated in a
          civil court of competent jurisdiction and not in arbitration. The litigation of those claims will be stayed
          pending the outcome of any individual claims in arbitration. Further, if any part of this Section is found to
          prohibit an individual claim seeking public injunctive relief, that provision will have no effect to the
          extent such relief is allowed to be sought out of arbitration, and the remainder of this Section will be
          enforceable. Again, let’s save us both time and money by resolving any disputes directly: contact our support
          team at <a href="mailto:help@outdoorsupplycentral.com">help@outdoorsupplycentral.com</a>.
        </p>
      </Section>

      <Section title="18. Changes to these Terms">
        <p>We may update these Terms and will display the revised effective date.</p>
        <p>
          For material changes, we will provide reasonable notice by email or a prominent site notice, except where a
          faster change is reasonably necessary for legal, security, or safety reasons.
        </p>
        <p>
          Changes generally apply prospectively. Unless required by law or agreed otherwise, existing orders remain
          governed by the transaction policies in effect when the orders were placed.
        </p>
        <p>Where required, we will request renewed acceptance.</p>
      </Section>

      <Section title="19. General provisions">
        <p>
          These Terms and the incorporated policies form the agreement governing your use of the marketplace. If an
          incorporated policy conflicts with these Terms, these Terms control unless they expressly provide otherwise.
        </p>
        <p>
          If a provision is found unenforceable, the remaining provisions remain in effect to the extent permitted by
          law.
        </p>
        <p>Failure to enforce a provision immediately does not waive the right to enforce it later.</p>
        <p>
          Provisions concerning outstanding payments, repayment obligations, retained records, liability, and disputes
          survive account closure to the extent necessary to give them effect.
        </p>
      </Section>

      <Section title="20. Contact">
        <Address />
        <p>
          For an order issue, use the order page’s reporting feature so your request can be connected to the
          transaction.
        </p>
      </Section>
    </>
  );
}

const PROVIDERS: [string, string][] = [
  ["Stripe", "Payment processing, seller verification, payouts, refunds, and related transaction administration."],
  [
    "Shippo and USPS",
    "Shipping rates, labels, delivery, and tracking. Information may include sender and recipient names, addresses, and contact information required for the service.",
  ],
  ["Supabase", "Database, authentication, file storage, and related application services, as configured for our site."],
  ["Vercel", "Website hosting, delivery, and related infrastructure services."],
  ["Resend", "Sending sign-in, account, order, and other service emails."],
  [
    "Geoapify",
    "Address suggestions. When you use an enabled address-suggestion field, the text entered in that field is sent to Geoapify to provide suggestions.",
  ],
  ["Cloudflare", "Runs our domain and email forwarding."],
];

export function privacyBody(): ReactNode {
  return (
    <>
      <Effective />
      <p>Outdoor Supply Central is operated by Outdoor Central, LLC (“we,” “us,” or “our”).</p>
      <p>
        This Privacy Policy explains what personal information we collect, why we use it, who receives it, and the
        choices available to you when you use our marketplace.
      </p>

      <Section title="1. Information you provide">
        <Sub>Account and profile information</Sub>
        <p>When you create or update an account, we collect:</p>
        <List
          items={[
            "Your email address, which you use to sign in and where we send account and order emails.",
            "What brings you here (buying, selling or both): required.",
            "Favorite activities: optional.",
            "Ship-from ZIP: sellers only, kept private, used to price shipping.",
            "Display name.",
          ]}
        />
        <p>Only your display name and city/state are ever public.</p>
        <Sub>Seller information</Sub>
        <p>
          If you sell through the marketplace, we collect your ship-from address and phone number to arrange shipping
          labels and support order fulfillment.
        </p>
        <p>
          Stripe collects information needed to establish and verify your seller payment account and process payouts.
          The information Stripe collects directly is subject to its privacy policy.
        </p>
        <Sub>Buyer information</Sub>
        <p>
          At checkout, we collect the recipient’s name, shipping address and your account email. We don’t ask for a
          phone number. Stripe collects card details, and any billing ZIP stays with Stripe.
        </p>
        <Sub>Listings and communications</Sub>
        <p>We collect the listings, descriptions, photographs, and other content you upload.</p>
        <p>
          We also collect information you send through problem threads, support requests, and other communications with
          us.
        </p>
        <p>
          Do not include sensitive personal information in listings, photographs, or messages unless it is necessary for
          the relevant transaction or support request.
        </p>
      </Section>

      <Section title="2. Technical information">
        <p>
          When you use the site, we and our service providers may automatically process technical information such as:
        </p>
        <List
          items={[
            "IP address.",
            "Browser and device information.",
            "Dates and times of access.",
            "Requested pages and application actions.",
            "Authentication events.",
            "Error reports and security logs.",
          ]}
        />
        <p>
          We use this information to operate the site, maintain account security, prevent abuse, diagnose problems, and
          improve reliability. We also use the approximate location from your IP address to apply legal restrictions on
          where the marketplace can be used.
        </p>
      </Section>

      <Section title="3. Payment information">
        <p>Payments and seller payouts are handled through Stripe.</p>
        <p>
          Our payment integration is designed so that full card numbers and full bank-account credentials are collected
          directly by Stripe rather than stored in our marketplace database.
        </p>
        <p>
          We receive information needed to administer transactions, such as payment status, payment amounts, refunds,
          payout status, and Stripe account or transaction identifiers.
        </p>
        <List
          items={[
            "We store Stripe reference numbers, amounts and statuses.",
            "We never receive card numbers, bank details or sellers’ identity documents. Stripe collects those on its own pages.",
            "We only see whether a seller’s payouts are active.",
          ]}
        />
      </Section>

      <Section title="4. How we use information">
        <p>We use personal information to:</p>
        <List
          items={[
            "Create and manage accounts.",
            "Send sign-in links and account notices.",
            "Display profiles and listings.",
            "Process orders and calculate marketplace fees.",
            "Facilitate payments and seller payouts.",
            "Obtain shipping rates and create labels.",
            "Display tracking information.",
            "Carry out shipping-deadline cancellations and refunds.",
            "Provide support and maintain transaction records.",
            "Detect fraud, investigate abuse, and enforce marketplace rules.",
            "Meet applicable legal, tax, and accounting obligations.",
          ]}
        />
        <p>We do not sell personal information or use it for targeted advertising.</p>
      </Section>

      <Section title="5. Information visible to other people">
        <Sub>Public information</Sub>
        <p>
          Your display name and city appear on your listings. Listing descriptions and photographs are also visible to
          people who view those listings.
        </p>
        <p>
          Do not put your home address, phone number, email address, or other information you want to keep private in a
          public listing or photograph.
        </p>
        <Sub>Information shared to fulfill an order</Sub>
        <p>A seller receives the buyer’s recipient name and shipping address through the order’s shipping label.</p>
        <p>
          Shipping labels and packages may display the seller’s name or other sender information and return address.
          Buyers may therefore see information that is not displayed on the seller’s public profile.
        </p>
        <p>
          Additional delivery or return information may be shared when reasonably necessary to complete an order,
          arrange an authorized return, or resolve a shipping issue.
        </p>
        <Sub>Threads</Sub>
        <p>
          Threads are accessible to the buyer, seller, and authorized personnel or service providers who need access to
          support the transaction, administer the site, or investigate an issue.
        </p>
        <p>
          Members may not use another member’s transaction information for unrelated marketing or other unauthorized
          purposes.
        </p>
      </Section>

      <Section title="6. Services we use">
        <p>We disclose information to service providers as reasonably necessary to operate the marketplace.</p>
        <dl className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-paper">
          {PROVIDERS.map(([name, purpose]) => (
            <div key={name} className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
              <dt className="font-semibold">{name}</dt>
              <dd>{purpose}</dd>
            </div>
          ))}
        </dl>
        <p>Providers may also process technical information needed to deliver and secure their services.</p>
        <p>
          Some providers, including payment processors and postal services, may process certain information under their
          own privacy policies and legal obligations.
        </p>
      </Section>

      <Section title="7. Other disclosures">
        <p>We may disclose relevant information when reasonably necessary to:</p>
        <List
          items={[
            "Comply with applicable law, legal process, or a valid government request.",
            "Investigate fraud, security incidents, or violations of our Terms.",
            "Protect the rights, safety, or property of members, the public, or Outdoor Central.",
            "Complete a merger, acquisition, reorganization, or transfer of business assets, subject to applicable privacy requirements.",
            "Carry out a disclosure you request or authorize.",
          ]}
        />
      </Section>

      <Section title="8. Cookies and similar technologies">
        <p>
          We use only sign-in session cookies and one cookie that remembers which page to return to after signing in. No
          ad cookies, and no email open or click tracking.
        </p>
        <p>Disabling necessary cookies or browser storage may prevent sign-in or other features from working.</p>
      </Section>

      <Section title="9. Storage and security">
        <p>
          Our website runs in the US, and our database is hosted in the US East (Northern Virginia) region. Some
          providers may process data outside the US: Geoapify, the address suggestions, is based in Europe, and Stripe,
          Shippo and Resend operate globally.
        </p>
      </Section>

      <Section title="10. How long we keep information">
        <p>
          We retain personal information for as long as reasonably necessary to operate the marketplace and for the
          purposes described in this Policy.
        </p>
        <p>
          Retention depends on the type of information and the reason it is needed. For example, we may retain certain
          records to:
        </p>
        <List
          items={[
            "Complete or document transactions.",
            "Meet tax and accounting requirements.",
            "Handle refunds, payment disputes, and shipping claims.",
            "Investigate fraud and maintain security.",
            "Establish, exercise, or defend legal claims.",
          ]}
        />
        <p>
          Deleting an account does not immediately remove every transaction record or information that must be retained
          for these purposes.
        </p>
        <p>
          Backup copies may remain until removed through the applicable backup-retention process. Providers may retain
          information under their own legal obligations and retention policies.
        </p>
      </Section>

      <Section title="11. Your choices and privacy requests">
        <p>
          You can update available account details and request account deletion through{" "}
          <Link href="/account">account settings</Link>.
        </p>
        <p>
          You may also contact us to request access to, correction of, or deletion of your personal information.
          Depending on applicable law, additional rights may be available to you, including obtaining a copy of certain
          information or appealing a decision concerning a privacy request.
        </p>
        <p>
          We may need to verify your identity before acting on a request. Some information may be retained or a request
          limited where permitted or required by law. We will explain applicable limitations when responding.
        </p>
        <p>
          You can choose not to provide optional information. Information necessary for account access, payment, or
          shipping may be required to use those features.
        </p>
        <p>
          Closing your account does not automatically close a separate Stripe account or delete information a provider
          must retain independently.
        </p>
      </Section>

      <Section title="12. Adults-only marketplace">
        <p>
          Outdoor Supply Central is intended for adults age 18 and older. We do not knowingly allow children to create
          marketplace accounts.
        </p>
        <p>
          If you believe a child has provided personal information through the site, contact us so we can investigate
          and take appropriate action.
        </p>
      </Section>

      <Section title="13. Changes to this Policy">
        <p>We may update this Privacy Policy and will display the revised effective date.</p>
        <p>
          For material changes, we will provide notice by email or a prominent site notice, as appropriate. Where
          required by applicable law, we will obtain consent before using information in a materially different way.
        </p>
      </Section>

      <Section title="14. Contact us">
        <p>For privacy questions or requests, contact:</p>
        <Address />
      </Section>
    </>
  );
}
