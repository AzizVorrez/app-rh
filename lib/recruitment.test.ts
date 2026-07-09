import { test } from "node:test";
import assert from "node:assert/strict";
import { computeScore, statusFor, DEFAULT_PASS_THRESHOLD } from "./recruitment";

test("statusFor — seuil par défaut 75%", () => {
  assert.equal(DEFAULT_PASS_THRESHOLD, 75);
  assert.equal(statusFor(75, 100), "Admis");
  assert.equal(statusFor(74, 100), "Réserve");
  assert.equal(statusFor(70, 100), "Réserve"); // 70 n'est plus « Admis »
  assert.equal(statusFor(60, 100), "Réserve");
  assert.equal(statusFor(59, 100), "Non retenu");
});

test("statusFor — seuil personnalisé", () => {
  assert.equal(statusFor(80, 100, 80), "Admis");
  assert.equal(statusFor(79, 100, 80), "Réserve");
  assert.equal(statusFor(90, 100, 90), "Admis");
  assert.equal(statusFor(89, 100, 90), "Réserve");
});

test("computeScore — agrège par bloc et aligne réponses/questions", () => {
  const questions = [
    { block: 1, correctIndex: 2 },
    { block: 1, correctIndex: 0 },
    { block: 2, correctIndex: 1 },
    { block: 3, correctIndex: 3 },
  ];
  const s = computeScore(questions, [2, 1, 1, 3]); // q0 ✓, q1 ✗, q2 ✓, q3 ✓
  assert.equal(s.block1, 1);
  assert.equal(s.block2, 1);
  assert.equal(s.block3, 1);
  assert.equal(s.total, 3);
  assert.equal(s.max, 4);
  assert.equal(s.pct, 75);
  assert.equal(s.status, "Admis");
});

test("computeScore — réponses null comptées comme fausses", () => {
  const s = computeScore(
    [
      { block: 1, correctIndex: 0 },
      { block: 1, correctIndex: 0 },
    ],
    [0, null],
  );
  assert.equal(s.total, 1);
  assert.equal(s.max, 2);
  assert.equal(s.pct, 50);
});

test("computeScore — score parfait = Admis 100%", () => {
  const q = [
    { block: 1, correctIndex: 1 },
    { block: 2, correctIndex: 2 },
    { block: 3, correctIndex: 0 },
  ];
  const s = computeScore(q, [1, 2, 0]);
  assert.equal(s.total, 3);
  assert.equal(s.pct, 100);
  assert.equal(s.status, "Admis");
});

test("computeScore — zéro question, pas de division par zéro", () => {
  const s = computeScore([], []);
  assert.equal(s.total, 0);
  assert.equal(s.max, 0);
  assert.equal(s.pct, 0);
  assert.equal(s.status, "Non retenu");
});
