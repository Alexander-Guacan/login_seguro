import {
  ErrorMessage,
  Field,
  Form,
  Formik,
  type FormikHelpers,
  type FormikProps,
} from "formik";
import * as yup from "yup";
import { useAuth } from "../hooks/auth/useAuth";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { SubmitButton } from "../components/Form/SubmitButton";
import { FaceDetectorModal } from "../components/Modal/FaceDetectionModal";
import { useDialog } from "../hooks/useDialog";

interface FormValues {
  email: string;
}

const initValues: FormValues = {
  email: "",
};

const validationSchema = yup.object({
  email: yup
    .string()
    .email("Ingrese un correo válido")
    .required("Este campo es obligatorio"),
});

export function BiometricLoginPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<FormikProps<FormValues>>(null);
  const { credentialLogin, faceLogin } = useAuth();
  const {
    open: faceDetectorOpen,
    hide: hideFaceDector,
    show: showFaceDetector,
  } = useDialog();
  const navigate = useNavigate();

  const handleSubmit = async (
    form: FormValues,
    { setSubmitting, resetForm }: FormikHelpers<FormValues>,
  ) => {
    setFormError(null);

    const result = await credentialLogin(form.email);

    if (!result.success) {
      setFormError(result.error);
    } else {
      resetForm();
      navigate("/dashboard");
    }

    setSubmitting(false);
  };

  const startFaceLogin = async () => {
    if (!formRef.current) return;

    const errors = await formRef.current.validateForm();
    const hasErrors = Object.values(errors).some(
      (error) => error != null && error.length > 0,
    );

    if (hasErrors) return;

    showFaceDetector();
  };

  const handleFaceDetection = async (descriptor: number[]) => {
    if (!formRef.current) return;

    formRef.current.setSubmitting(true);
    const email = formRef.current.values.email;

    const result = await faceLogin(email, descriptor);

    if (!result.success) {
      setFormError(result.error);
    } else {
      formRef.current.resetForm();
      navigate("/dashboard");
    }

    formRef.current.setSubmitting(false);
    hideFaceDector();
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
          innerRef={formRef}
        >
          {({ isSubmitting, dirty }) => (
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
              <SubmitButton loading={isSubmitting} disabled={!dirty}>
                Huella digital o PIN
              </SubmitButton>
              <SubmitButton
                loading={isSubmitting}
                disabled={!dirty}
                onClick={startFaceLogin}
              >
                Face ID
              </SubmitButton>
              {formError && (
                <p className="alert alert--error text-xs">{formError}</p>
              )}
            </Form>
          )}
        </Formik>
      </section>
      <article className="py-6">
        <p>
          ¿No tienes una cuenta?{" "}
          <Link className="link" to={"/login"}>
            Registrate
          </Link>
        </p>
      </article>

      <FaceDetectorModal
        open={faceDetectorOpen}
        onDetection={handleFaceDetection}
        onCancel={hideFaceDector}
      />
    </main>
  );
}
