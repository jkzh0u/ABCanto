/**
 * Classical poems written faintly across the page in cursive script (草書),
 * with small red annotations naming each poem, like notes on an old scroll.
 * All three are about being far from home.
 *
 * The cursive font only covers simplified-Chinese code points, so a few
 * traditional characters are written in their cursive-derived forms (歸 as 归,
 * 鄉 as 乡, ...). Those shapes come from cursive handwriting in the first place
 * (simplified Chinese adopted many of them), so this is how a calligrapher
 * would write them anyway. The poems' names in the red notes stay traditional.
 */
const POEMS: { text: string; note: string }[] = [
  { text: "慈母手中線遊子身上衣臨行密密縫意恐遲遲歸誰言寸草心報得三春暉", note: "孟郊　遊子吟" },
  { text: "床前明月光疑是地上霜舉頭望明月低頭思故鄉", note: "李白　靜夜思" },
  { text: "獨在異鄉為異客每逢佳節倍思親遙知兄弟登高處遍插茱萸少一人", note: "王維　九月九日憶山東兄弟" },
];

// Traditional → cursive-script form, only for characters the cursive font lacks.
const CURSIVE_FORM: Record<string, string> = {
  線: "线", 遊: "游", 臨: "临", 縫: "缝", 遲: "迟", 歸: "归", 誰: "谁", 報: "报", 暉: "晖",
  舉: "举", 頭: "头", 鄉: "乡",
  獨: "独", 異: "异", 為: "为", 節: "节", 親: "亲", 遙: "遥", 處: "处",
};

const cursive = (text: string) => [...text].map((c) => CURSIVE_FORM[c] ?? c).join("");

// Repeat the poems so the columns fill even very tall pages; overflow is clipped.
const ROUNDS = 4;

export function Verse() {
  return (
    <div className="verse" aria-hidden="true">
      <div className="verse-text" lang="zh">
        {Array.from({ length: ROUNDS }, (_, round) =>
          POEMS.map((poem) => (
            <span key={`${round}-${poem.note}`}>
              {cursive(poem.text)}
              <span className="verse-note" lang="zh-HK">
                {poem.note}
              </span>
            </span>
          )),
        )}
      </div>
    </div>
  );
}
