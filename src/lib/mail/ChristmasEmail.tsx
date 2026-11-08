import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type ChristmasEmailProps = {
  lang: string;
  preview: string;
  eyebrow: string;
  heading: string;
  paragraphs: string[];
  highlight?: { label: string; value: string; note?: string };
  details?: { label: string; value: string }[];
  cta?: { label: string; href: string };
  links?: { label: string; href: string }[];
  footer: string;
};

const colors = {
  cream: "#F6EDE1",
  paper: "#FFFBF5",
  red: "#A8322D",
  green: "#2F5D46",
  ink: "#3B2A22",
  muted: "#8A7566",
  gold: "#C9963B",
};

const serif = "Georgia, 'Times New Roman', serif";
const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export function ChristmasEmail(props: ChristmasEmailProps) {
  return (
    <Html lang={props.lang}>
      <Head />
      <Preview>{props.preview}</Preview>
      <Body style={{ backgroundColor: colors.cream, margin: 0, padding: "32px 12px", fontFamily: sans }}>
        <Container style={{ maxWidth: 560, margin: "0 auto" }}>
          <Section
            style={{
              backgroundColor: colors.green,
              borderRadius: "28px 28px 0 0",
              padding: "28px 32px 22px",
              textAlign: "center",
            }}
          >
            <Text style={{ color: colors.gold, letterSpacing: 6, fontSize: 13, margin: 0 }}>✦ ❄ ✦</Text>
            <Text
              style={{
                color: colors.cream,
                fontFamily: serif,
                fontSize: 22,
                fontStyle: "italic",
                margin: "8px 0 0",
              }}
            >
              Santa Helper
            </Text>
          </Section>
          <Section
            style={{
              backgroundColor: colors.paper,
              borderRadius: "0 0 28px 28px",
              padding: "32px 36px 36px",
              boxShadow: "0 18px 40px rgba(59,42,34,0.12)",
            }}
          >
            <Text
              style={{
                color: colors.red,
                textTransform: "uppercase",
                letterSpacing: 2,
                fontSize: 12,
                fontWeight: 700,
                margin: 0,
              }}
            >
              {props.eyebrow}
            </Text>
            <Heading
              as="h1"
              style={{ fontFamily: serif, color: colors.ink, fontSize: 30, lineHeight: "36px", margin: "10px 0 18px" }}
            >
              {props.heading}
            </Heading>
            {props.paragraphs.map((p, i) => (
              <Text key={i} style={{ color: colors.ink, fontSize: 16, lineHeight: "26px", margin: "0 0 14px" }}>
                {p}
              </Text>
            ))}

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

            <Hr style={{ borderColor: "#EADFD2", margin: "28px 0 16px" }} />
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: "18px", margin: 0 }}>{props.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
