const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix KO strings
const koStart = content.indexOf('KO: {');
if (koStart !== -1) {
    const koEndSearch = content.indexOf(' home: ', koStart);
    const koEnd = content.indexOf('}', koEndSearch) + 1;

    const newKo = `KO: {
    brand: "AuraCanvas",
    tagline: "의도가 깃든 디지털 성소",
    heroTitle: "이건 단순한 이미지가 아닙니다. <br /> <span class='whitespace-nowrap'>당신의 <span class='aura-gold-text'>투사체를</span> 선택하세요.</span>",
    heroSubtitle: "당신의 의식을 풍요, 사랑, 에너지의 파동과 정렬하도록 설계된 프리미엄 디지털 의식 도구입니다.",
    enterGallery: "갤러리 입장하기",
    categoryAll: "모든 주파수",
    acquisition: "활성화",
    acquirePiece: "의식 시작하기",
    investment: "에너지 교환",
    downloadArt: "주파수 완성",
    successTitle: "정렬이 완료되었습니다",
    successSubtitle: "작품이 당신의 의도와 동기화되었습니다. 아래에서 완성 방식을 선택하세요.",
    footerText: "의식 있는 영혼을 위한 프리미엄 디지털 아트. 모든 점은 기도이며, 모든 선은 정렬입니다.",
    copyright: "© 2026 AuraCanvas. 현실로 구현.",
    adminPanel: "갤러리 관리",
    signIn: "영혼 연결",
    signOut: "연결 해제",
    categories: "에너지 주파수",
    myLibrary: "나의 성소",
    home: "갤러리"
  }`;
    content = content.substring(0, koStart) + newKo + content.substring(koEnd);
}

// Fix corrupted About section strings
content = content.replace(/\?\?br\/>/g, '<br/>');
content = content.replace(/\?셱e/g, "'re");
content = content.replace(/\?셲/g, "'s");
content = content.replace(/짤 2026/g, '© 2026');

// Fix Card 3 placeholder
const pocketSearch = 'mockups?.pocket?.imageUrl';
const pocketIdx = content.lastIndexOf(pocketSearch);
if (pocketIdx !== -1) {
    const talismanStart = content.indexOf(') : (', pocketIdx);
    if (talismanStart !== -1) {
        const talismanEnd = content.indexOf(')}', talismanStart) + 2;
        const replacement = `) : (
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent z-10" />
                    )}`;
        content = content.substring(0, talismanStart) + replacement + content.substring(talismanEnd);
    }
}

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('App.tsx restored successfully.');
