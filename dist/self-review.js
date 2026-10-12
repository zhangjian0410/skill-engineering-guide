const nameInput = document.getElementById('skill-name');
const modeInput = document.getElementById('review-mode');
const promptOutput = document.getElementById('self-review-prompt');
const copyButton = document.getElementById('copy-self-review');
const copyStatus = document.getElementById('self-review-copy-status');
const template = promptOutput.value;
let isCopying = false;

function updatePrompt() {
  const name = nameInput.value.trim();
  const text = template.replaceAll('【Skill 名称】', () => name || '【Skill 名称】');
  promptOutput.value = (modeInput.value === 'deep' ? '本次明确要求直接进行深度筛查。\n\n' : '') + text;
  copyButton.disabled = isCopying || !name;
  copyStatus.textContent = '';
}

nameInput.addEventListener('input', updatePrompt);
modeInput.addEventListener('change', updatePrompt);
copyButton.addEventListener('click', async () => {
  if (copyButton.disabled) return;
  const copiedText = promptOutput.value;
  isCopying = true;
  copyButton.disabled = true;
  try {
    await navigator.clipboard.writeText(copiedText);
    copyStatus.textContent = promptOutput.value === copiedText
      ? '已复制，粘贴到能读取该 Skill 的 AI 工具中使用。'
      : '刚才的内容已复制；名称或模式已更改，请重新复制。';
  } catch {
    copyStatus.textContent = '复制未成功，请选中右侧或下方提示词手动复制。';
  } finally {
    isCopying = false;
    copyButton.disabled = !nameInput.value.trim();
  }
});
updatePrompt();
