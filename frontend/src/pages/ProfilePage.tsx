import { ErrorMessage, Field, Form, Formik, type FormikHelpers } from "formik";
import { useProfile } from "../hooks/user/useProfile";
import type { User } from "../models/user";
import { getRoleName, UserRole } from "../enums/userRole.enum";
import * as yup from "yup";
import { useState } from "react";
import { PageHeader } from "../components/PageSection/PageHeader";
import { SubmitButton } from "../components/Form/SubmitButton";
import { useAuth } from "../hooks/auth/useAuth";
import { useAlert } from "../hooks/useAlert";

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
  const { reloadSession } = useAuth();
  const { showAlert } = useAlert();
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const handleSubmit = async (
    values: User,
    { setSubmitting }: FormikHelpers<User>,
  ) => {
    setFormError(null);

    const updateResult = await updateProfile(values);

    if (!updateResult.success) {
      setFormError(updateResult.error);
    } else {
      setFormMessage(updateResult.message);

      setTimeout(() => {
        setFormMessage(null);
      }, 3500);
    }

    if (updateResult.success) {
      const reloadResult = await reloadSession();

      if (!reloadResult.success) {
        showAlert(reloadResult.error, { type: "error" });
      } else {
        showAlert(reloadResult.message, { type: "success" });
      }
    }

    setSubmitting(false);
  };

  if (!user) return null;

  return (
    <main className="flex flex-col gap-6 h-full">
      <PageHeader title="Perfil" breadcrumbsLabels={["Dashboard", "Perfil"]} />
      <section className="form-container mx-auto w-full max-w-100">
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
            <Form noValidate>
              <div className="field-group">
                <label htmlFor="firstName">Nombre</label>
                <Field type="text" id="firstName" name="firstName" required />
                <ErrorMessage
                  className="alert alert--error text-xs"
                  component="p"
                  name="firstName"
                />
              </div>
              <div className="field-group">
                <label htmlFor="lastName">Apellido</label>
                <Field type="text" id="lastName" name="lastName" required />
                <ErrorMessage
                  className="alert alert--error text-xs"
                  component="p"
                  name="lastName"
                />
              </div>
              <div className="field-group">
                <label htmlFor="email">Correo electrónico</label>
                <Field type="email" id="email" name="email" readOnly disabled />
                <ErrorMessage
                  className="alert alert--error text-xs"
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
                  className="alert alert--error text-xs"
                  component="p"
                  name="role"
                />
              </div>
              <div className="flex flex-col gap-y-4">
                <SubmitButton disabled={!dirty} loading={isSubmitting}>
                  Actualizar
                </SubmitButton>
                {formError && (
                  <p className="alert alert--error text-xs">{formError}</p>
                )}
                {formMessage && (
                  <p className="alert alert--success text-sm">{formMessage}</p>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </section>
    </main>
  );
}
