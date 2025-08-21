async function refreshDatabase(env) {
  const categories = ['business', 'entertainment', 'health', 'science', 'sports', 'technology'];

  let refreshCount = 0;
  try {
    const countQuery = await env.DB.prepare("SELECT value FROM metadata WHERE key = 'refresh_count'").all();
    if (countQuery.results.length > 0) {
      refreshCount = parseInt(countQuery.results[0].value) || 0;
    }
  } catch (error) {
    console.error('Error fetching refresh count:', error);
    return { success: false, errors: ['Failed to fetch refresh count: ' + error.message] };
  }

  refreshCount += 1;

  const errors = [];

  for (const category of categories) {
    try {
      await env.DB.prepare(`SELECT 1 FROM ${category} LIMIT 1`).all();
    } catch (error) {
      console.error(`Table ${category} does not exist or is inaccessible:`, error);
      errors.push(`Table ${category} does not exist or is inaccessible: ${error.message}`);
      return { success: false, errors }; // Stop if any table is missing
    }
  }

  for (const category of categories) {
    const newsApiUrl = `add your deployed url`;
    let data = [];
    try {
      const response = await fetch(newsApiUrl, {
        headers: {
          'User-Agent': 'NewsApp/1.0'
        }
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`0xarc-newsapi request failed with status ${response.status}: ${errorBody}`);
      }
      data = await response.json();
    } catch (error) {
      console.error(`Error fetching or parsing news for ${category}:`, error);
      errors.push(`Error fetching or parsing news for ${category}: ${error.message}`);
    }

    if (Array.isArray(data) && data.length > 0) {
      let existingTitles;
      try {
        const titleQuery = await env.DB.prepare(`SELECT title FROM ${category}`).all();
        existingTitles = new Set(titleQuery.results.map(row => row.title));
      } catch (error) {
        console.error(`Error fetching existing titles for ${category}:`, error);
        errors.push(`Error fetching existing titles for ${category}: ${error.message}`);
      }

      if (existingTitles) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoISO = sevenDaysAgo.toISOString();

        for (const article of data) {
          const title = article.title || 'no title';
          const description = article.description || 'no description';
          const url = article.link || '#';
          const urlToImage = article.thumbnail_url || '#';
          const publishedAt = article.pubdate || new Date().toISOString();

          if (publishedAt < sevenDaysAgoISO) {
            console.log(`Skipping article older than 7 days in ${category}:`, { title, publishedAt });
            continue;
          }

          if (existingTitles.has(title)) {
            console.log(`Skipping duplicate article in ${category}:`, { title });
            continue;
          }
          try {
            const result = await env.DB.prepare(
              `INSERT INTO ${category} (title, description, url, urlToImage, publishedAt, summary, content) VALUES (?, ?, ?, ?, ?, ?, ?)`
            )
              .bind(title, description, url, urlToImage, publishedAt, null, null)
              .run();
            console.log(`Inserted article into ${category}:`, { title });
            existingTitles.add(title);
          } catch (error) {
            console.error(`Error inserting article into ${category} table:`, error);
            errors.push(`Error inserting article into ${category} table: ${error.message}`);
          }
        }

        try {
          const deleteResult = await env.DB.prepare(
            `DELETE FROM ${category} WHERE publishedAt < ?`
          )
            .bind(sevenDaysAgoISO)
            .run();
          console.log(`Removed ${deleteResult.meta.changes} old entries from ${category} older than ${sevenDaysAgoISO}:`, deleteResult);
        } catch (error) {
          console.error(`Error removing old entries from ${category}:`, error);
          errors.push(`Error removing old entries from ${category}: ${error.message}`);
        }
      }
    } else if (!Array.isArray(data)) {
      console.error(`Invalid 0xarc-newsapi response for ${category}:`, data);
      errors.push(`Invalid 0xarc-newsapi response for ${category}: ${JSON.stringify(data)}`);
    } else {
      console.log(`No articles returned for ${category}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  try {
    await env.DB.prepare(
      "INSERT OR REPLACE INTO metadata (key, value, last_refresh) VALUES ('refresh_count', ?, ?)"
    )
      .bind(refreshCount, new Date().toISOString())
      .run();
  } catch (error) {
    console.error('Error updating refresh count and last_refresh:', error);
    errors.push('Error updating refresh count and last_refresh: ' + error.message);
    return { success: false, errors };
  }

  return { success: errors.length === 0, errors };
}

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const categories = ['business', 'entertainment', 'health', 'science', 'sports', 'technology'];

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders()
      });
    }

    if (url.pathname === '/refresh' && request.method === 'GET') {
      const result = await refreshDatabase(env);
      if (!result.success) {
        return new Response('Errors occurred during refresh:\n' + result.errors.join('\n'), {
          status: 500,
          headers: { ...getCorsHeaders(), 'Content-Type': 'text/plain' }
        });
      }
      return new Response('News data refreshed successfully.', {
        status: 200,
        headers: { ...getCorsHeaders(), 'Content-Type': 'text/plain' }
      });
    }
    if (url.pathname === '/lastupdate' && request.method === 'GET') {
      try {
        const result = await env.DB.prepare(
          "SELECT last_refresh FROM metadata WHERE key = 'refresh_count'"
        ).first();
        if (result && result.last_refresh) {
          return new Response(JSON.stringify({ last_refresh: result.last_refresh }), {
            status: 200,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({ error: 'No last refresh timestamp found' }), {
            status: 404,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        console.error('Error fetching last_refresh:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch last_refresh: ' + error.message }), {
          status: 500,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }
    }

    if (url.pathname === '/likecnt' && request.method === 'GET') {
      const username = url.searchParams.get('username');
      const category = url.searchParams.get('category');
      const id = url.searchParams.get('id');

      if (!username) {
        return new Response(JSON.stringify({ error: 'Username parameter is required' }), {
          status: 400,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }
      if (!category) {
        return new Response(JSON.stringify({ error: 'Category parameter is required' }), {
          status: 400,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }
      if (!categories.includes(category)) {
        return new Response(JSON.stringify({ error: `Invalid category. Must be one of: ${categories.join(', ')}` }), {
          status: 400,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }
      if (!id || isNaN(parseInt(id))) {
        return new Response(JSON.stringify({ error: 'Valid numeric id parameter is required' }), {
          status: 400,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }

      try {
        const article = await env.DB.prepare(
          `SELECT likes, liked_by FROM ${category} WHERE id = ?`
        )
          .bind(id)
          .first();

        if (!article) {
          return new Response(JSON.stringify({ error: 'Article not found' }), {
            status: 404,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        }

        let likedBy;
        try {
          likedBy = JSON.parse(article.liked_by || '[]');
          if (!Array.isArray(likedBy)) {
            likedBy = [];
          }
        } catch (error) {
          console.error(`Error parsing liked_by for id ${id} in ${category}:`, error);
          return new Response(JSON.stringify({ error: 'Failed to parse liked_by data' }), {
            status: 500,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        }

        if (likedBy.includes(username)) {
          likedBy = likedBy.filter(user => user !== username);
          const newLikes = Math.max(0, (article.likes || 0) - 1);
          try {
            await env.DB.prepare(
              `UPDATE ${category} SET likes = ?, liked_by = ? WHERE id = ?`
            )
              .bind(newLikes, JSON.stringify(likedBy), id)
              .run();
            console.log(`Removed like for article id ${id} in ${category} by ${username}`);
            return new Response(JSON.stringify({ likes: newLikes, liked_by: likedBy }), {
              status: 200,
              headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
            });
          } catch (error) {
            console.error(`Error updating unlike for id ${id} in ${category}:`, error);
            return new Response(JSON.stringify({ error: 'Failed to update unlike: ' + error.message }), {
              status: 500,
              headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
            });
          }
        } else {
          likedBy.push(username);
          const newLikes = (article.likes || 0) + 1;
          try {
            await env.DB.prepare(
              `UPDATE ${category} SET likes = ?, liked_by = ? WHERE id = ?`
            )
              .bind(newLikes, JSON.stringify(likedBy), id)
              .run();
            console.log(`Incremented likes for article id ${id} in ${category} by ${username}`);
            return new Response(JSON.stringify({ likes: newLikes, liked_by: likedBy }), {
              status: 200,
              headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
            });
          } catch (error) {
            console.error(`Error updating likes for id ${id} in ${category}:`, error);
            return new Response(JSON.stringify({ error: 'Failed to update likes: ' + error.message }), {
              status: 500,
              headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
            });
          }
        }
      } catch (error) {
        console.error(`Error querying article id ${id} in ${category}:`, error);
        return new Response(JSON.stringify({ error: 'Failed to fetch article: ' + error.message }), {
          status: 500,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }
    }

    if (url.pathname === '/summary' && request.method === 'GET') {
      const category = url.searchParams.get('category');
      const id = url.searchParams.get('id');

      if (!category) {
        return new Response(JSON.stringify({ error: 'Category parameter is required' }), {
          status: 400,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }
      if (!categories.includes(category)) {
        return new Response(JSON.stringify({ error: `Invalid category. Must be one of: ${categories.join(', ')}` }), {
          status: 400,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }
      if (!id || isNaN(parseInt(id))) {
        return new Response(JSON.stringify({ error: 'Valid numeric id parameter is required' }), {
          status: 400,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }

      try {
        const article = await env.DB.prepare(
          `SELECT id, title, description, url, urlToImage, publishedAt, summary, content, likes, liked_by FROM ${category} WHERE id = ?`
        )
          .bind(id)
          .first();

        if (!article) {
          return new Response(JSON.stringify({ error: 'Article not found' }), {
            status: 404,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        }

        let articleResponse = {
          id: article.id,
          source: article.url ? new URL(article.url).hostname : 'unknown',
          title: article.title,
          description: article.description,
          url: article.url,
          urlToImage: article.urlToImage,
          publishedAt: article.publishedAt,
          summary: article.summary || '',
          content: article.content || '',
          likes: article.likes,
          liked_by: JSON.parse(article.liked_by)
        };

        if (article.summary && article.summary.trim() !== '') {
          return new Response(JSON.stringify(articleResponse), {
            status: 200,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        }

        try {
          const response = await fetch('add extract url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'NewsApp/1.0'
            },
            body: JSON.stringify({
              title: article.title,
              description: article.description,
              url: article.url
            })
          });

          if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`newsextractapi request failed with status ${response.status}: ${errorBody}`);
          }

          const data = await response.json();
          const { summary, content } = data;

          try {
            await env.DB.prepare(
              `UPDATE ${category} SET summary = ?, content = ? WHERE id = ?`
            )
              .bind(summary || '', content || '', id)
              .run();
            console.log(`Stored summary and content for article id ${id} in ${category}`);
          } catch (error) {
            console.error(`Error storing summary and content for id ${id} in ${category}:`, error);
            return new Response(JSON.stringify({ error: 'Failed to store summary and content: ' + error.message }), {
              status: 500,
              headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
            });
          }

          articleResponse.summary = summary || '';
          articleResponse.content = content || '';

          return new Response(JSON.stringify(articleResponse), {
            status: 200,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error(`Error fetching summary from newsextractapi for id ${id} in ${category}:`, error);
          return new Response(JSON.stringify({ error: 'Failed to fetch summary: ' + error.message }), {
            status: 500,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        console.error(`Error querying article id ${id} in ${category}:`, error);
        return new Response(JSON.stringify({ error: 'Failed to fetch article: ' + error.message }), {
          status: 500,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }
    }
    if (url.pathname === '/all' && request.method === 'GET') {
      const allArticles = [];
      let totalResults = 0;

      try {
        for (const category of categories) {
          const query = await env.DB.prepare(
            `SELECT id, title, description, url, urlToImage, publishedAt, likes, liked_by, summary, content, ? AS category FROM ${category} ORDER BY publishedAt DESC`
          )
            .bind(category)
            .all();

          const articles = query.results.map(row => ({
            id: row.id,
            source: row.url ? new URL(row.url).hostname : 'unknown',
            title: row.title,
            description: row.description,
            url: row.url,
            urlToImage: row.urlToImage,
            publishedAt: row.publishedAt,
            summary: row.summary || '',
            content: row.content || '',
            likes: row.likes,
            liked_by: JSON.parse(row.liked_by),
            category: row.category
          }));

          allArticles.push(...articles);
          totalResults += articles.length;
        }

        allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        const limitedArticles = allArticles.slice(0, 10000);

        const responseData = {
          status: 'ok',
          totalResults: limitedArticles.length,
          articles: limitedArticles
        };

        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error querying all articles:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch all articles: ' + error.message }), {
          status: 500,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }
    }

    if (request.method === 'GET' && categories.includes(url.pathname.slice(1))) {
      const category = url.pathname.slice(1);
      let query;
      try {
        query = await env.DB.prepare(
          `SELECT id, title, description, url, urlToImage, publishedAt, likes, liked_by, summary, content FROM ${category} ORDER BY publishedAt DESC`
        ).all();
      } catch (error) {
        console.error(`Error querying ${category} table:`, error);
        return new Response(`Failed to fetch news for ${category}: ` + error.message, {
          status: 500,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }

      const responseData = {
        status: 'ok',
        totalResults: query.results.length,
        articles: query.results.map(row => ({
          id: row.id,
          source: row.url ? new URL(row.url).hostname : 'unknown',
          title: row.title,
          description: row.description,
          url: row.url,
          urlToImage: row.urlToImage,
          publishedAt: row.publishedAt,
          summary: row.summary || '',
          content: row.content || '',
          likes: row.likes,
          liked_by: JSON.parse(row.liked_by)
        }))
      };

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    return new Response('Endpoint not found. Use GET /refresh, GET /lastupdate, GET /summary?category=<category>&id=<id>, GET /all, or GET /{category}.', {
      status: 404,
      headers: { ...getCorsHeaders(), 'Content-Type': 'text/plain' }
    });
  },

  async scheduled(event, env, ctx) {
    console.log(`Cron job triggered at ${new Date().toISOString()}`);
    const result = await refreshDatabase(env);
    if (!result.success) {
      console.error('Cron refresh failed:', result.errors.join('\n'));
    } else {
      console.log('Cron refresh completed successfully.');
    }
  }
};