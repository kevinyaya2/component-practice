import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormQuestionnaireComponent } from './form-questionnaire.component';

describe('FormQuestionnaireComponent', () => {
  let component: FormQuestionnaireComponent;
  let fixture: ComponentFixture<FormQuestionnaireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormQuestionnaireComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormQuestionnaireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
