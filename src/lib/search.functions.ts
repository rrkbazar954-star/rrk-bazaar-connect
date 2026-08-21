import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { interpretImage, interpretTextQuery } from "./search.server";

export const interpretQuery = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ query: z.string().min(1).max(300) }).parse(data))
  .handler(async ({ data }) => interpretTextQuery(data.query));

export const interpretPhoto = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({ image: z.string().startsWith("data:image/").max(8_000_000) })
      .parse(data),
  )
  .handler(async ({ data }) => interpretImage(data.image));
