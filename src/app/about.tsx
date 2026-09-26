import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

export default function AboutScreen() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.hero}>Yodda</Text>
      <Text style={styles.tagline}>Learn once. Remember longer.</Text>

      <Section title="What Yodda does">
        <Paragraph>
          Yodda turns anything you want to remember into a short question and answer, then
          brings it back for review at the moment you&apos;re about to forget it — not
          before, and not too late. You never manage a schedule yourself; the app decides
          when each item is due.
        </Paragraph>
      </Section>

      <Section title="How the scheduling logic works">
        <Paragraph>
          Every card moves through four states: <Text style={styles.bold}>New</Text> (never
          reviewed), <Text style={styles.bold}>Learning</Text> (still fragile),{' '}
          <Text style={styles.bold}>Review</Text> (holding up over days), and{' '}
          <Text style={styles.bold}>Mature</Text> (holding up over weeks or months).
        </Paragraph>
        <Paragraph>
          After you reveal an answer, you rate how well you remembered it —{' '}
          <Text style={styles.bold}>Again</Text>, <Text style={styles.bold}>Hard</Text>,{' '}
          <Text style={styles.bold}>Good</Text>, or <Text style={styles.bold}>Easy</Text>.
          That rating feeds an algorithm derived from SM-2 (the method behind most modern
          spaced-repetition apps): remembering easily pushes the next review further out;
          struggling or forgetting brings it back sooner and resets its progress. Over
          repeated successful reviews, the interval between them grows — a few days, then a
          couple of weeks, then months — so your effort concentrates on what you&apos;re
          actually at risk of forgetting, not what you already know cold.
        </Paragraph>
      </Section>

      <Section title="The forgetting curve">
        <Paragraph>
          This isn&apos;t a new idea. In 1885, German psychologist{' '}
          <Text style={styles.bold}>Hermann Ebbinghaus</Text> ran memory experiments on
          himself and plotted how quickly newly learned information fades — the{' '}
          <Text style={styles.bold}>forgetting curve</Text>. He found memory drops off
          sharply within days of learning something, but each time it&apos;s successfully
          recalled, the curve flattens: the next drop-off is slower than the last.
        </Paragraph>
        <Paragraph>
          Spaced repetition is the practical response to that curve — reviewing right as
          memory is about to fade, rather than on a fixed schedule or not at all. Yodda
          automates exactly that timing so you don&apos;t have to think about it.
        </Paragraph>
      </Section>

      <Section title="Why it's useful">
        <Paragraph>
          Most learning is wasted because review either never happens or happens too late,
          after the information is already gone and has to be relearned from scratch.
          Spacing reviews at increasing intervals is one of the most well-evidenced ways to
          move something from short-term into long-term memory, using far less total study
          time than re-reading or cramming.
        </Paragraph>
      </Section>

      <Section title="Privacy">
        <Paragraph>
          Everything you add lives only on this device, in a local database. There&apos;s no
          account, no cloud sync, and nothing is ever sent anywhere.
        </Paragraph>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5), paddingBottom: spacing(6), gap: spacing(2) },
  hero: { fontSize: 30, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: spacing(1) },
  tagline: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: spacing(1) },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing(2),
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing(1.25),
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  paragraph: { fontSize: 14.5, color: colors.text, lineHeight: 21 },
  bold: { fontWeight: '700', color: colors.primary },
});
