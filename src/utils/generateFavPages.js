const axios = require("axios");
const API_KEY = require("../../secrets").API_KEY;

async function generateFavPages(userFavs, doc) {
  for (const fav of userFavs) {
    const { movieRefId } = fav.toJSON();
    const {
      data: {
        title,
        tagline,
        runtime,
        overview,
        original_title,
        poster_path,
        release_date,
        credits: { cast },
      },
    } = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieRefId}?api_key=${API_KEY}&append_to_response=credits`
    );
    doc
      .font("Helvetica")
      .fontSize(25)
      .text(
        (title || original_title) +
          (release_date ? ` (${release_date.substring(0, 4)})` : "")
      );
    tagline && doc.font("Helvetica").fontSize(16).text(tagline);

    if (poster_path) {
      const { data } = await axios(
        `https://image.tmdb.org/t/p/w342${poster_path}`,
        {
          responseType: "arraybuffer",
        }
      );
      const img = Buffer.from(data, "base64");
      doc.image(img, { scale: 0.75 });
    }

    doc.font("Helvetica").fontSize(14).text("\n", { lineGap: 5 });
    overview &&
      doc.font("Helvetica").fontSize(14).text(overview, { lineGap: 5 });
    runtime &&
      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .text("Runtime: " + runtime + " minutes.", { lineGap: 5 });

    if (cast && cast.length) {
      doc.addPage();
      doc.font("Helvetica").fontSize(18).text("Starring:", { align: "center" });
      doc.font("Helvetica").fontSize(14).text("\n");

      let height = 100;
      for (let i = 0; i < 5 && i < cast.length; i++) {
        if (cast[i].profile_path) {
          const { data } = await axios(
            `https://image.tmdb.org/t/p/w185${cast[i].profile_path}`,
            {
              responseType: "arraybuffer",
            }
          );
          const img = Buffer.from(data, "base64");

          doc
            .image(img, 50, height, { align: "center", scale: 0.5 })
            .fontSize(14)
            .text(cast[i].name + " as " + cast[i].character, 50, height + 50, {
              align: "center",
            });

          height += 150;
        } else {
          doc
            .font("Helvetica")
            .fontSize(14)
            .text(cast[i].name + " as " + cast[i].character, 50, height + 50, {
              align: "center",
            });

          height += 150;
        }
      }
    }

    doc.addPage();
  }
}

module.exports = generateFavPages;
