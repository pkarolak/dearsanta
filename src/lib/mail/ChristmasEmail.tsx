import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { appUrl } from "@/lib/auth";
import { brand } from "@/lib/brand";

export type ChristmasEmailProps = {
  lang: string;
  preview: string;
  heading: string;
  paragraphs: string[];
  /** A personal message from the Elf Chief, shown as a signed gift tag. */
  note?: { label: string; signature: string; text: string };
  highlight?: { label: string; value: string; note?: string };
  details?: { label: string; value: string }[];
  cta?: { label: string; href: string };
  links?: { label: string; href: string }[];
  footer: string;
  /** Where the header picture comes from: a public URL, or `cid:…` for an inline attachment. */
  santaSrc?: string;
};

/** The header picture travels inside the mail, so it shows even while the app runs on a local network. */
export const santaInline = { contentId: "santa", path: "public/show/santa-email.png", filename: "santa.png" } as const;

const colors = {
  snow: "#FFF9F0",
  cream: "#F5E9D8",
  paper: "#FFFDF8",
  wall: "#9B1F29",
  red: "#B8202C",
  green: "#1D5A3A",
  ink: "#2B1810",
  muted: "#6F5547",
  gold: "#E0A82E",
  goldLine: "#E3C27A",
};

const serif = "Georgia, 'Times New Roman', serif";
const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export function ChristmasEmail(props: ChristmasEmailProps) {
  return (
    <Html lang={props.lang}>
      <Head />
      <Preview>{props.preview}</Preview>
      <Body style={{ backgroundColor: colors.snow, margin: 0, padding: "32px 12px", fontFamily: sans }}>
        <Container style={{ maxWidth: 560, margin: "0 auto" }}>
          <Section
            style={{
              backgroundColor: colors.wall,
              borderRadius: "28px 28px 0 0",
              padding: "26px 32px 0",
              textAlign: "center",
            }}
          >
            <Text style={{ color: colors.snow, fontFamily: serif, fontSize: 22, fontWeight: 700, margin: "0 0 14px" }}>
              {brand.name}
            </Text>
            <Img
              src={props.santaSrc ?? `${appUrl()}/show/santa-email.png`}
              width="180"
              height="150"
              alt="Santa"
              style={{ display: "block", margin: "0 auto", border: 0 }}
            />
          </Section>
          <Section
            style={{
              backgroundColor: colors.paper,
              border: `2px solid ${colors.cream}`,
              borderTop: 0,
              borderRadius: "0 0 28px 28px",
              padding: "32px 36px 36px",
            }}
          >
            <Heading
              as="h1"
              style={{ fontFamily: serif, color: colors.ink, fontSize: 30, fontWeight: 700, lineHeight: "36px", margin: "0 0 18px" }}
            >
              {props.heading}
            </Heading>
            {props.paragraphs.map((p, i) => (
              <Text key={i} style={{ color: colors.ink, fontSize: 16, lineHeight: "26px", margin: "0 0 14px" }}>
                {p}
              </Text>
            ))}

            {props.note && (
              <Section
                style={{
                  backgroundColor: colors.snow,
                  border: `1.5px dashed ${colors.goldLine}`,
                  borderRadius: 20,
                  padding: "8px 28px 22px",
                  margin: "24px 0",
                  textAlign: "center",
                }}
              >
                <Text style={{ color: colors.gold, fontFamily: serif, fontSize: 64, lineHeight: "64px", margin: "0 0 -18px" }}>
                  “
                </Text>
                <Text
                  style={{
                    color: colors.red,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    margin: "0 0 10px",
                  }}
                >
                  {props.note.label}
                </Text>
                <Text style={{ color: colors.ink, fontFamily: serif, fontSize: 19, fontStyle: "italic", lineHeight: "29px", margin: 0, whiteSpace: "pre-line" }}>
                  {props.note.text}
                </Text>
                <Text style={{ color: colors.muted, fontFamily: serif, fontSize: 16, fontWeight: 700, margin: "14px 0 0" }}>
                  — {props.note.signature}
                </Text>
              </Section>
            )}

            {props.highlight && (
              <Section
                style={{
                  backgroundColor: colors.cream,
                  borderRadius: 22,
                  padding: "22px 24px",
                  margin: "18px 0",
                  textAlign: "center",
                }}
              >
                <Text style={{ color: colors.muted, fontSize: 13, margin: 0 }}>{props.highlight.label}</Text>
                <Text style={{ fontFamily: serif, color: colors.red, fontSize: 32, margin: "6px 0 0", fontWeight: 700 }}>
                  {props.highlight.value}
                </Text>
                {props.highlight.note && (
                  <Text style={{ color: colors.ink, fontSize: 14, margin: "10px 0 0" }}>{props.highlight.note}</Text>
                )}
              </Section>
            )}

            {props.details && props.details.length > 0 && (
              <Section style={{ margin: "18px 0" }}>
                {props.details.map((d) => (
                  <Text key={d.label} style={{ margin: "0 0 8px", fontSize: 15, color: colors.ink }}>
                    <span style={{ color: colors.muted }}>{d.label}: </span>
                    <strong>{d.value}</strong>
                  </Text>
                ))}
              </Section>
            )}

            {props.cta && (
              <Section style={{ textAlign: "center", margin: "26px 0 10px" }}>
                <Button
                  href={props.cta.href}
                  style={{
                    backgroundColor: colors.red,
                    color: "#fff",
                    borderRadius: 999,
                    padding: "15px 30px",
                    fontWeight: 700,
                    fontSize: 16,
                    textDecoration: "none",
                    boxShadow: "inset 0 -4px 0 rgba(0,0,0,0.18)",
                  }}
                >
                  {props.cta.label}
                </Button>
              </Section>
            )}

            {props.links && props.links.length > 0 && (
              <Text style={{ textAlign: "center", fontSize: 14, margin: "16px 0 0" }}>
                {props.links.map((l, i) => (
                  <span key={l.href}>
                    {i > 0 && <span style={{ color: colors.muted }}> · </span>}
                    <Link href={l.href} style={{ color: colors.green, fontWeight: 600 }}>
                      {l.label}
                    </Link>
                  </span>
                ))}
              </Text>
            )}

            <Hr style={{ borderColor: colors.cream, margin: "28px 0 16px" }} />
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: "18px", margin: 0 }}>{props.footer}</Text>
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: "18px", margin: "8px 0 0" }}>
              <a href={`mailto:${brand.contact}`} style={{ color: colors.muted }}>
                {brand.contact}
              </a>
              {" · "}
              <a href={brand.url} style={{ color: colors.muted }}>
                {brand.domain}
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
