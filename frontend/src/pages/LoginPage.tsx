import { ErrorMessage, Field, Form, Formik, type FormikHelpers } from "formik";
import type { LoginRequestDTO } from "../dto/auth";
import * as yup from "yup";
import { useAuth } from "../hooks/auth/useAuth";
import { useState } from "react";
import { useNavigate } from "react-router";

const initValues: LoginRequestDTO = {
  email: "",
  password: "",
};

const validationSchema = yup.object({
  email: yup
    .string()
    .email("Ingrese un correo válido")
    .required("Este campo es obligatorio"),
  password: yup.string().required("Este campo es obligatorio"),
});

export function LoginPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (
    values: LoginRequestDTO,
    { setSubmitting, resetForm }: FormikHelpers<LoginRequestDTO>,
  ) => {
    setFormError(null);

    const email = values.email.trim();
    const password = values.password.trim();

    const result = await login({
      email,
      password,
    });

    if (!result.success) {
      setFormError(result.error);
    } else {
      resetForm();
      navigate("/dashboard");
    }

    setSubmitting(false);
  };

  return (
    <main className="content-center text-center w-full h-full">
      <section className="inline-flex flex-col gap-y-12">
        <h1 className="text-4xl font-semibold">Iniciar Sesión</h1>
        <Formik
          initialValues={initValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="form" noValidate>
              <div className="field-group">
                <label htmlFor="email">Correo electrónico</label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  required
                  autoFocus
                />
                <ErrorMessage
                  className="form-message form-message--error"
                  component="p"
                  name="email"
                />
              </div>
              <div className="field-group">
                <label htmlFor="password">Contraseña</label>
                <Field type="password" id="password" name="password" required />
                <ErrorMessage
                  className="form-message form-message--error"
                  component="p"
                  name="password"
                />
              </div>
              <button className="button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Cargando" : "Ingresar"}
              </button>
              {formError && <p className="alert alert--error">{formError}</p>}
            </Form>
          )}
        </Formik>
      </section>
    </main>
  );
}
