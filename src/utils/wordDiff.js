// Word-level diff (LCS): [{ t: 'same' | 'del' | 'add', w }]. Used to show
// original → suggested text in the intake form and the AI assistant.
export const wordDiff = (a, b) => {
  const A = a.split(/\s+/).filter(Boolean);
  const B = b.split(/\s+/).filter(Boolean);
  const dp = Array.from({ length: A.length + 1 }, () => new Array(B.length + 1).fill(0));
  for (let i = A.length - 1; i >= 0; i--) {
    for (let j = B.length - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out = [];
  let i = 0; let j = 0;
  while (i < A.length && j < B.length) {
    if (A[i] === B[j]) { out.push({ t: 'same', w: A[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ t: 'del', w: A[i++] }); }
    else { out.push({ t: 'add', w: B[j++] }); }
  }
  while (i < A.length) out.push({ t: 'del', w: A[i++] });
  while (j < B.length) out.push({ t: 'add', w: B[j++] });
  return out;
};
