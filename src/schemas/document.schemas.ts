import { z } from "zod";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export const cpfSchema = z
  .string()
  .transform(onlyDigits)
  .pipe(
    z
      .string()
      .regex(/^\d{11}$/, "CPF deve conter exatamente 11 dígitos"),
  );

export const cnpjSchema = z
  .string()
  .transform(onlyDigits)
  .pipe(
    z
      .string()
      .regex(/^\d{14}$/, "CNPJ deve conter exatamente 14 dígitos"),
  );