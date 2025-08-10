"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitAdCopyRequest, type FormState } from "./actions";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Loader2, Wand2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Wand2 className="mr-2 h-4 w-4" />
      )}
      Generate Creatives
    </Button>
  );
}

export function CreativesForm() {
  const initialState: FormState = { message: "" };
  const [state, formAction] = useFormState(submitAdCopyRequest, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message && state.message !== "Successfully generated ad copy.") {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.message,
      });
    }
    if (state.adCopies && state.adCopies.length > 0) {
      formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form action={formAction} ref={formRef}>
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>
              Provide the details for your ad campaign.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                name="productName"
                placeholder="e.g. Quantum-Leap Laptop"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                name="targetAudience"
                placeholder="e.g. Tech professionals, students"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="campaignGoal">Campaign Goal</Label>
              <Input
                id="campaignGoal"
                name="campaignGoal"
                placeholder="e.g. Increase sales, brand awareness"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tone">Tone</Label>
              <Select name="tone" defaultValue="professional">
                <SelectTrigger>
                  <SelectValue placeholder="Select a tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="humorous">Humorous</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="adventurous">Adventurous</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                name="keywords"
                placeholder="e.g. AI-powered, long battery life, lightweight"
                required
              />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="numberOfVariations">Number of Variations (1-5)</Label>
                <Input id="numberOfVariations" name="numberOfVariations" type="number" defaultValue="3" min="1" max="5" />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </Card>
      </form>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Generated Ad Copy</CardTitle>
            <CardDescription>
              Your AI-powered ad copy will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {state.adCopies && state.adCopies.length > 0 ? (
              state.adCopies.map((copy, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="p-4 text-sm">{copy}</CardContent>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                <Lightbulb className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Your creative ideas are waiting to be sparked.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
