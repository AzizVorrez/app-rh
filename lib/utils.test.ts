import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidEmail, normalizeEmail } from "./utils";

test("isValidEmail — accepte des emails valides", () => {
  for (const e of ["jean.dupont@gmail.com", "x@y.io", "a+tag@sub.domaine.co.uk", "PRENOM.NOM@izichange.africa"]) {
    assert.equal(isValidEmail(e), true, e);
  }
});

test("isValidEmail — rejette accents, TLD 1 lettre, double point, point final, espace", () => {
  for (const e of [
    "hervé@gmail.com",
    "a@b.c",
    "jean..dupont@gmail.com",
    "jean@gmail.com.",
    "jean dupont@gmail.com",
    "jean@gmail",
    ".jean@gmail.com",
  ]) {
    assert.equal(isValidEmail(e), false, e);
  }
});

test("normalizeEmail — trim + minuscule", () => {
  assert.equal(normalizeEmail("  Jean.Dupont@GMAIL.com "), "jean.dupont@gmail.com");
});
