import { ErrorMessage, Field, Form, Formik, type FormikHelpers } from "formik";
import type { LoginRequestDTO } from "../dto/auth";
import * as yup from "yup";
import { useAuth } from "../hooks/auth/useAuth";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { PasswordInput } from "../components/Form/PasswordInput";
import { SubmitButton } from "../components/Form/SubmitButton";

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

  const handleSubmit = async (
    values: LoginRequestDTO,
    { setSubmitting, resetForm }: FormikHelpers<LoginRequestDTO>,
  ) => {
    setFormError(null);

    const result = await login(values);

    if (!result.success) {
      setFormError(result.error);
    } else {
      resetForm();
      navigate("/dashboard");
    }

    setSubmitting(false);
  };

  return (
    <main className="content-center text-center w-full h-full p-8">
      <section className="form-container mx-auto border-0 max-w-90">
        <header>
          <h1 className="form-container__title">Iniciar sesión</h1>
        </header>
        <Formik
          initialValues={initValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values, handleChange, handleBlur }) => (
            <Form noValidate>
              <div className="field-group">
                <label htmlFor="email">Correo electrónico</label>
                <Field type="email" id="email" name="email" />
                <ErrorMessage
                  className="alert alert--error text-xs"
                  component="p"
                  name="email"
                />
              </div>
              <div className="field-group">
                <label htmlFor="password">Contraseña</label>
                <PasswordInput
                  id="password"
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  className="alert alert--error text-xs"
                  component="p"
                  name="password"
                />
              </div>
              <SubmitButton loading={isSubmitting}>Ingresar</SubmitButton>
              {formError && (
                <p className="alert alert--error text-xs">{formError}</p>
              )}
            </Form>
          )}
        </Formik>
        <Link className="link-outline" to={"/biometric-login"}>
          Llave de acceso
        </Link>
      </section>
      <article className="py-6">
        <p>
          ¿No tienes una cuenta?{" "}
          <Link className="link" to={"/login"}>
            Registrate
          </Link>
        </p>
      </article>
    </main>
  );
}
