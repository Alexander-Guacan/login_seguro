import { ErrorMessage, Field, Form, Formik, type FormikHelpers } from "formik";
import { useProfile } from "../hooks/user/useProfile";
import type { User } from "../models/user";
import { getRoleName, UserRole } from "../enums/userRole.enum";
import * as yup from "yup";
import { useState } from "react";

const validationSchema = yup.object({
  firstName: yup
    .string()
    .min(3, "El nombre es muy corto")
    .max(50, "El nombre es muy largo")
    .required("Este campo es obligatorio"),
  lastName: yup
    .string()
    .min(3, "El apellido es muy corto")
    .max(50, "El apellido es muy largo")
    .required("Este campo es obligatorio"),
});

export function ProfilePage() {
  const { user, updateProfile } = useProfile();
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const handleSubmit = async (
    values: User,
    { setSubmitting }: FormikHelpers<User>,
  ) => {
    setFormError(null);

    const result = await updateProfile(values);

    if (!result.success) {
      setFormError(result.error);
    } else {
      setFormMessage(result.message);
      setTimeout(() => {
        setFormMessage(null);
      }, 3500);
    }

    setSubmitting(false);
  };

  if (!user) return null;

  return (
    <main className="flex flex-col gap-6 h-full">
      <section className="px-6 py-4 rounded-md bg-sky-800">
        <h2>Bienvenido de vuelta 👋</h2>
      </section>
      <section className="form-container form-container--multicolumn w-fit">
        <header>
          <h3>Perfil</h3>
        </header>
        <Formik
          initialValues={user}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, dirty }) => (
            <Form>
              <div className="field-group">
                <label htmlFor="firstName">Nombre</label>
                <Field type="text" id="firstName" name="firstName" required />
                <ErrorMessage
                  className="input-message input-message--error"
                  component="p"
                  name="firstName"
                />
              </div>
              <div className="field-group">
                <label htmlFor="lastName">Apellido</label>
                <Field type="text" id="lastName" name="lastName" required />
                <ErrorMessage
                  className="input-message input-message--error"
                  component="p"
                  name="lastName"
                />
              </div>
              <div className="field-group">
                <label htmlFor="email">Correo electrónico</label>
                <Field type="email" id="email" name="email" readOnly disabled />
                <ErrorMessage
                  className="input-message input-message--error"
                  component="p"
                  name="email"
                />
              </div>
              <div className="field-group">
                <label htmlFor="role">Rol</label>
                <Field as="select" id="role" name="role" disabled>
                  <option value={UserRole.ADMIN}>
                    {getRoleName(UserRole.ADMIN)}
                  </option>
                  <option value={UserRole.CLIENT}>
                    {getRoleName(UserRole.CLIENT)}
                  </option>
                </Field>
                <ErrorMessage
                  className="input-message input-message--error"
                  component="p"
                  name="role"
                />
              </div>
              <div className="flex flex-col gap-y-4">
                <button
                  className="button"
                  type="submit"
                  disabled={!dirty || isSubmitting}
                >
                  {isSubmitting ? "Actualizando..." : "Actualizar"}
                </button>
                {formError && <p className="alert alert--error">{formError}</p>}
                {formMessage && (
                  <p className="alert alert--success">{formMessage}</p>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </section>
    </main>
  );
}
