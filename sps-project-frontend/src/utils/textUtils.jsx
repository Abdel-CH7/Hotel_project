export const highlightText = (text = "", searchTerm) => {
    if (!searchTerm) return text;
  
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex) || parts;
    // const parts = text ? text.split(regex) : [text];

    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? 
      <span key={index} style={{ backgroundColor: 'yellow' }}>{part}</span> : 
      part
    );
  };
  