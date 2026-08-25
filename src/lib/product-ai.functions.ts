import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { describeProductImage } from "./product-ai.server";

export const describeProduct = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ image: z.string().startsWith("data:image/").max(8_000_000) }).parse(data),
  )
  .handler(async ({ data }) => describeProductImage(data.image));
