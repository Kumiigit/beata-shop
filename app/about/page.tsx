import type { Metadata } from 'next';
import { ContentPage } from '@/components/content-page';

export const metadata: Metadata = { title: 'Our story' };

export default function Page() {
  return <ContentPage eyebrow="The Beata point of view" title="Good clothes should have something to say." intro="Beata Shop makes relaxed everyday clothing with funny, honest text for people who like their wardrobe comfortable and their humour slightly too accurate.">
    <div className="about-wordmark" role="img" aria-label="Beata Shop logo and original text-design placeholder">
      <img src="/beata-logo.png" alt="Beata Shop" />
      <strong>WEAR WHAT<br />YOU MEAN</strong>
    </div>
    <h2>Original words. Everyday pieces.</h2>
    <p>We put sharp one-liners and familiar moods on soft T-shirts, hoodies, sweatshirts, long sleeves and accessories. The result is simple clothing with just enough personality to start a conversation—or end one.</p>
    <h2>Made to be worn, not saved for later.</h2>
    <p>Comfortable unisex fits, useful details and clean typography keep every design easy to style. Whether the message is dry, dramatic or deeply relatable, it should still feel like your favourite piece of clothing.</p>
    <blockquote>Less basic. More you.</blockquote>
  </ContentPage>;
}
