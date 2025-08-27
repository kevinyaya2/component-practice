import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-questionnaire',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-questionnaire.component.html',
  styleUrls: ['./form-questionnaire.component.css']
})
export class FormQuestionnaireComponent {
  questionnaireForm: FormGroup;
  results: any[] = [];
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder) {
    this.questionnaireForm = this.fb.group({
      name: ['', Validators.required],
      age: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      exercise: ['', Validators.required],
      sugarDrink: ['', Validators.required],
      smoking: ['', Validators.required],
    });

    this.loadResults();
  }

  onSubmit() {
    if (this.questionnaireForm.valid) {
      const formValue = {
        ...this.questionnaireForm.value,
        timestamp: new Date()
      };
      this.results.push(formValue);
      localStorage.setItem('simpleQuestionnaireResults', JSON.stringify(this.results));
      this.questionnaireForm.reset();

      this.successMessage = '送出成功！';
      this.errorMessage = null;
      setTimeout(() => this.successMessage = null, 3000);
    } else {
      // ❌ 表單不合法 → 全部欄位標記為 touched
      Object.values(this.questionnaireForm.controls).forEach(control => {
        control.markAsTouched();
      });

      this.errorMessage = '送出失敗，請檢查欄位';
      this.successMessage = null;
      setTimeout(() => this.errorMessage = null, 3000);
    }
  }

  loadResults() {
    const stored = localStorage.getItem('simpleQuestionnaireResults');
    if (stored) {
      this.results = JSON.parse(stored);
    }
  }

  deleteResult(index: number) {
    this.results.splice(index, 1);
    localStorage.setItem('simpleQuestionnaireResults', JSON.stringify(this.results));
  }

  clearAll() {
    this.results = [];
    localStorage.removeItem('simpleQuestionnaireResults');
  }
}
