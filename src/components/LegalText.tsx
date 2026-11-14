import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { type } from '../theme/typography';

/**
 * Afișează un text juridic scris în Markdown simplu (politica de confidențialitate):
 * titluri (#, ##, ###), paragrafe, liste (- , cu un nivel de indentare) și **bold**.
 * Liniile `---` sunt ignorate.
 */
export default function LegalText({ markdown }: { markdown: string }) {
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length) {
      blocks.push(
        <Text key={`p${blocks.length}`} style={styles.paragraph}>
          {inline(paragraph.join(' '))}
        </Text>,
      );
      paragraph = [];
    }
  };

  for (const raw of markdown.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim() || line.trim() === '---') {
      flush();
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const bullet = /^(\s*)-\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      const level = heading[1]!.length;
      const style = level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;
      blocks.push(
        <Text key={`h${blocks.length}`} style={style}>
          {inline(heading[2]!)}
        </Text>,
      );
    } else if (bullet) {
      flush();
      const nested = bullet[1]!.length >= 2;
      blocks.push(
        <View key={`b${blocks.length}`} style={[styles.bulletRow, nested && styles.nested]}>
          <Text style={styles.bulletDot}>{nested ? '–' : '•'}</Text>
          <Text style={styles.bulletText}>{inline(bullet[2]!)}</Text>
        </View>,
      );
    } else {
      paragraph.push(line.trim());
    }
  }
  flush();

  return <View style={styles.root}>{blocks}</View>;
}

/** **bold** în interiorul unui rând. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <Text key={i} style={styles.bold}>
        {part.slice(2, -2)}
      </Text>
    ) : (
      part
    ),
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  h1: { ...type.screenTitle, fontSize: 26 },
  h2: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 14 },
  h3: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 6 },
  paragraph: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  bold: { color: colors.text, fontWeight: '600' },
  bulletRow: { flexDirection: 'row', gap: 8, paddingRight: 4 },
  nested: { paddingLeft: 18 },
  bulletDot: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  bulletText: { flex: 1, color: colors.muted, fontSize: 14, lineHeight: 21 },
});
