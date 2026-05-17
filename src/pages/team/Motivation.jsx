/**
 * @module pages/team/Motivation
 * @description Minimal motivation page placeholder for team section.
 * @author Gauthier Rammault
 * @version 1.0.0
 * @license proprietary
 */
import Navbar from "../../components/Navbar.jsx";
import SectionNavButtons from "../../components/SectionNavButtons.jsx";
import MaterialIcon from "../../components/MaterialIcon.jsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { teamLinks } from "../../constants/navigationLinks.js";
import { QUIZZES } from "../quiz/index.js";

function resolveQuestionCount(quiz) {
  if (Array.isArray(quiz?.affirmations)) return quiz.affirmations.length;
  if (Array.isArray(quiz?.questions)) return quiz.questions.length;
  if (Array.isArray(quiz?.traits)) return quiz.traits.length;
  if (Array.isArray(quiz?.oppositions)) return quiz.oppositions.length;
  if (Array.isArray(quiz?.modèles)) return quiz.modèles.length;
  return 0;
}

/**
 * Renders the Motivation page.
 * @returns {JSX.Element} The rendered page layout.
 *
 * @example
 * import { lazy } from "react";
 * const Motivation = lazy(() => import("./pages/team/Motivation.jsx"));
 *
 * // Real usage reference: src/App.jsx
 * <Route path="/team/motivation" element={<Motivation />} />;
 */
export default function Motivation() {
  const navigate = useNavigate();
  const quizCards = Object.values(QUIZZES || {});
  const [hoveredInfoQuizId, setHoveredInfoQuizId] = useState(null);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-200 py-12 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-bold text-gray-800">Motivation</h1>
            <SectionNavButtons
              links={teamLinks}
              ariaLabel="Navigation motivation"
              variant="page"
            />
          </div>

          <div className="max-w-7xl mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {quizCards.map((quiz) => {
              const questionCount = resolveQuestionCount(quiz);

              return (
                <div
                  key={quiz.id}
                  onClick={() =>
                    navigate("/team/motivation/invitation", { state: { quizId: quiz.id } })
                  }
                  className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-2 cursor-pointer"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={quiz.image}
                      alt={quiz.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                    <h2 className="absolute bottom-4 left-4 text-white text-xl font-bold">
                      {quiz.title}
                    </h2>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span
                        className="inline-flex items-center gap-1 text-gray-500"
                        onMouseEnter={() => setHoveredInfoQuizId(quiz.id)}
                        onMouseLeave={() => setHoveredInfoQuizId(null)}
                        onFocus={() => setHoveredInfoQuizId(quiz.id)}
                        onBlur={() => setHoveredInfoQuizId(null)}
                        tabIndex={0}
                        role="button"
                        aria-label={`Plus d'infos sur ${quiz.title}`}
                      >
                        <MaterialIcon name="info" size={16} className="text-gray-500" />
                        <span>plus d'infos</span>
                      </span>
                      <span>
                        🧠 {questionCount > 0 ? `${questionCount} questions` : "Sans questions"}
                      </span>
                    </div>

                    <div>
                      {hoveredInfoQuizId === quiz.id ? (
                        <div>
                          <p className="font-semibold text-gray-700 mb-2">
                            {quiz.author || "Auteur non renseigné."}
                          </p>
                          <p className="text-sm text-gray-600">
                            {quiz.definition || "Définition indisponible."}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-gray-700 mb-2">Quand l'utiliser :</p>
                          <p className="text-sm text-gray-600">
                            {quiz.description || "Description indisponible."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
