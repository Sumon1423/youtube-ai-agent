function extractJSON(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Gemini returned an empty response.");
  }

  let cleaned = text.trim();

  // Remove Markdown code fences
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Extract JSON object
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini did not return a JSON object.");
  }

  cleaned = cleaned.slice(start, end + 1);

  // Fix common JSON formatting issues safely
  function repairJSON(input) {
    let output = "";
    let inString = false;
    let escaped = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];

      if (inString) {
        output += char;

        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }

        continue;
      }

      if (char === '"') {
        inString = true;
        output += char;
        continue;
      }

      // Quote unquoted property names
      if (char === "{" || char === ",") {
        output += char;

        let j = i + 1;

        while (/\s/.test(input[j] || "")) {
          output += input[j];
          j++;
        }

        const match = input.slice(j).match(
          /^([A-Za-z_$][A-Za-z0-9_$-]*)\s*:/
        );

        if (match) {
          output += `"${match[1]}"`;
          i = j + match[1].length;
          continue;
        }

        continue;
      }

      output += char;
    }

    // Remove trailing commas before } or ]
    output = output.replace(/,\s*([}\]])/g, "$1");

    return output;
  }

  const repaired = repairJSON(cleaned);

  try {
    return JSON.parse(repaired);
  } catch (error) {
    const positionMatch = error.message.match(/position\s+(\d+)/);
    const position = positionMatch
      ? Number(positionMatch[1])
      : 0;

    console.error("Gemini JSON parsing failed:", {
      error: error.message,
      nearbyText: repaired.slice(
        Math.max(0, position - 150),
        position + 150
      ),
    });

    throw new Error(
      `Gemini returned malformed JSON. ${error.message}`
    );
  }
}
