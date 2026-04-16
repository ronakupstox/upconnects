const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function fetchQuestions() {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
    sorts: [{ property: 'Order', direction: 'ascending' }],
  });

  return response.results
    .map((page) => {
      const props = page.properties;
      return {
        id: page.id,
        question: props.Question?.title?.[0]?.plain_text ?? '',
        options: {
          A: props['Option A']?.rich_text?.[0]?.plain_text ?? '',
          B: props['Option B']?.rich_text?.[0]?.plain_text ?? '',
          C: props['Option C']?.rich_text?.[0]?.plain_text ?? '',
          D: props['Option D']?.rich_text?.[0]?.plain_text ?? '',
        },
        correctAnswer: props['Correct Answer']?.select?.name ?? 'A',
        order: props.Order?.number ?? 0,
      };
    })
    .filter((q) => q.question.length > 0);
}

module.exports = { fetchQuestions };
