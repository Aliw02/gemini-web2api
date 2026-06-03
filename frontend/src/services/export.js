export function exportTXT(messages) {
  if (!messages.length) return;
  const lines = messages.map(m => {
    const who = m.role === 'user' ? 'أنت' : 'ألي AI';
    const text = m.display || m.content;
    return `[${who}]\n${text}\n`;
  });
  const header = `ألي AI — محادثة\nالتاريخ: ${new Date().toLocaleDateString('ar-SA')}\n${'─'.repeat(40)}\n\n`;
  download(header + lines.join('\n' + '─'.repeat(40) + '\n\n'), 'ali-chat.txt', 'text/plain');
}

export function exportMarkdown(messages) {
  if (!messages.length) return;
  const lines = messages.map(m => {
    const who = m.role === 'user' ? '**أنت**' : '**ألي AI**';
    const text = m.display || m.content;
    return `### ${who}\n\n${text}\n`;
  });
  const header = `# ألي AI — محادثة\n\n> ${new Date().toLocaleDateString('ar-SA')}\n\n---\n\n`;
  download(header + lines.join('\n---\n\n'), 'ali-chat.md', 'text/markdown');
}

export function copyAll(messages) {
  if (!messages.length) return;
  const text = messages.map(m => {
    const who = m.role === 'user' ? 'أنت' : 'ألي AI';
    const content = m.display || m.content;
    return `${who}:\n${content}`;
  }).join('\n\n────────────\n\n');
  navigator.clipboard.writeText(text);
}

export function triggerPDF() {
  setTimeout(() => window.print(), 300);
}

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
