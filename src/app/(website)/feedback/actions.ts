"use server";

import { createServiceClient } from "@/lib/supabase/service";

type FavouriteCategory =
  | "drinks_chilled"
  | "drinks_hot"
  | "chati_idli"
  | "dosa"
  | "uthapam"
  | "dessert";

type SubmitFeedbackArgs = {
  foodRating: number;
  serviceRating: number;
  favouriteCategory: FavouriteCategory;
  feedback?: string;
};

function isValidRating(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export async function submitFeedback(
  args: SubmitFeedbackArgs,
): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isValidRating(args.foodRating)) {
    return {
      success: false,
      error: "Please rate the food.",
    };
  }

  if (!isValidRating(args.serviceRating)) {
    return {
      success: false,
      error: "Please rate our service.",
    };
  }

  const validCategories: FavouriteCategory[] = [
    "drinks_chilled",
    "drinks_hot",
    "chati_idli",
    "dosa",
    "uthapam",
    "dessert",
  ];

  if (!validCategories.includes(args.favouriteCategory)) {
    return {
      success: false,
      error: "Please select your favourite category.",
    };
  }

  try {
    const supabase = createServiceClient();

    const { error } = await supabase.from("feedback").insert({
      food_rating: args.foodRating,
      service_rating: args.serviceRating,
      favourite_category: args.favouriteCategory,
      feedback: args.feedback?.trim() || null,
    });

    if (error) {
      console.error("Feedback insert failed:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Feedback submission failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Something went wrong — please try again.",
    };
  }
}