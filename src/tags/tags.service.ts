import { Injectable } from '@nestjs/common';
const vntk = require('vntk');
const posTagger = vntk.posTag(); // ✅ đúng

@Injectable()
export class TagsService {
  extractTags(title: string, maxTags = 100000): string[] {
    const cleanTitle = title
      .toLowerCase()
      .replace(/[.,:;!?()"“”‘’]/g, "");

    // POS tagging
    const tagged: [string, string][] = posTagger.tag(cleanTitle);

    // Lọc ra danh từ (N, Np = proper noun, Nc = classifier noun)
    let candidates = tagged
      .filter(([word, tag]) => tag.startsWith('N'))
      .map(([word]) => word.replace(/_/g, ' ')); // đổi "_" thành khoảng trắng

    // Đếm tần suất
    const freq: Record<string, number> = {};
    for (const c of candidates) {
      freq[c] = (freq[c] || 0) + 1;
    }

    // Sắp xếp: theo tần suất rồi độ dài
    const sorted = Object.entries(freq)
      .sort((a, b) => {
        if (b[1] === a[1]) return b[0].length - a[0].length;
        return b[1] - a[1];
      })
      .map(([key]) => key);

    return sorted.slice(0, maxTags);
  }
}
